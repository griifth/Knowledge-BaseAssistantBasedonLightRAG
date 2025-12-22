"""
This module contains all workspace-related routes for the LightRAG API.
Workspace management for multi-knowledge-base support based on local file storage.
"""

import os
import re
import shutil
from typing import Optional, List
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from lightrag.utils import logger
from lightrag.kg.shared_storage import initialize_pipeline_status
from ..utils_api import get_combined_auth_dependency

router = APIRouter(tags=["workspace"])

# Valid workspace name pattern: alphanumeric and underscore only
WORKSPACE_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]+$")


class WorkspaceInfo(BaseModel):
    """Workspace information model"""

    name: str = Field(..., description="Workspace name")
    is_default: bool = Field(
        False, description="Whether this is the default workspace"
    )
    document_count: int = Field(0, description="Number of documents in workspace")
    has_graph: bool = Field(False, description="Whether graph data exists")


class WorkspaceListResponse(BaseModel):
    """Response model for listing workspaces"""

    workspaces: List[WorkspaceInfo] = Field(
        default_factory=list, description="List of available workspaces"
    )
    current_workspace: str = Field("", description="Currently active workspace")
    total_count: int = Field(0, description="Total number of workspaces")


class WorkspaceCreateRequest(BaseModel):
    """Request model for creating a workspace"""

    name: str = Field(
        ...,
        description="Workspace name (alphanumeric and underscore only)",
        min_length=1,
        max_length=64,
        examples=["my_knowledge_base", "project_a"],
    )


class WorkspaceCreateResponse(BaseModel):
    """Response model for workspace creation"""

    status: str = Field(..., description="Operation status")
    message: str = Field(..., description="Operation message")
    workspace: Optional[WorkspaceInfo] = Field(
        None, description="Created workspace info"
    )


class WorkspaceDeleteResponse(BaseModel):
    """Response model for workspace deletion"""

    status: str = Field(..., description="Operation status")
    message: str = Field(..., description="Operation message")


class WorkspaceSwitchRequest(BaseModel):
    """Request model for switching workspace"""

    name: str = Field(..., description="Target workspace name")


class WorkspaceSwitchResponse(BaseModel):
    """Response model for workspace switch"""

    status: str = Field(..., description="Operation status")
    message: str = Field(..., description="Operation message")
    workspace: str = Field(..., description="Current workspace after switch")


def is_valid_workspace_name(name: str) -> bool:
    """Check if workspace name is valid"""
    if not name:
        return False
    return bool(WORKSPACE_NAME_PATTERN.match(name))


def get_workspace_info(working_dir: Path, workspace_name: str) -> WorkspaceInfo:
    """Get information about a specific workspace"""
    if workspace_name:
        workspace_path = working_dir / workspace_name
    else:
        workspace_path = working_dir

    # Check for document status file to count documents
    doc_status_file = workspace_path / "kv_store_doc_status.json"
    document_count = 0
    if doc_status_file.exists():
        try:
            import json

            with open(doc_status_file, "r", encoding="utf-8") as f:
                doc_data = json.load(f)
                document_count = len(doc_data)
        except Exception:
            pass

    # Check for graph file
    graph_file = workspace_path / "graph_chunk_entity_relation.graphml"
    has_graph = graph_file.exists()

    return WorkspaceInfo(
        name=workspace_name if workspace_name else "(default)",
        is_default=not workspace_name,
        document_count=document_count,
        has_graph=has_graph,
    )


def create_workspace_routes(
    working_dir: str,
    input_dir: str,
    default_workspace: str,
    api_key: Optional[str] = None,
):
    """
    Create workspace management routes.

    Args:
        working_dir: The base working directory for RAG storage
        input_dir: The base input directory for documents
        default_workspace: The server's default workspace
        api_key: Optional API key for authentication
    """
    combined_auth = get_combined_auth_dependency(api_key)
    working_path = Path(working_dir)
    input_path = Path(input_dir)

    @router.get(
        "/workspaces",
        response_model=WorkspaceListResponse,
        dependencies=[Depends(combined_auth)],
        summary="List all workspaces",
        description="Scan the working directory to discover all available workspaces",
    )
    async def list_workspaces(request: Request):
        """
        List all available workspaces by scanning the working directory.

        For local file storage, workspaces are subdirectories under working_dir.
        """
        try:
            workspaces = []

            # Check if default workspace (root directory) has data
            default_info = get_workspace_info(working_path, "")
            if default_info.document_count > 0 or default_info.has_graph:
                workspaces.append(default_info)

            # Scan subdirectories for workspaces
            if working_path.exists():
                for item in working_path.iterdir():
                    if item.is_dir() and is_valid_workspace_name(item.name):
                        workspace_info = get_workspace_info(working_path, item.name)
                        # Include all valid workspace directories (even if empty/new)
                        workspaces.append(workspace_info)

            # Get current workspace from header or use default
            current_workspace = request.headers.get("LIGHTRAG-WORKSPACE", "").strip()
            if not current_workspace:
                current_workspace = default_workspace

            return WorkspaceListResponse(
                workspaces=workspaces,
                current_workspace=current_workspace
                if current_workspace
                else "(default)",
                total_count=len(workspaces),
            )
        except Exception as e:
            logger.error(f"Error listing workspaces: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    @router.post(
        "/workspaces",
        response_model=WorkspaceCreateResponse,
        dependencies=[Depends(combined_auth)],
        summary="Create a new workspace",
        description="Create a new workspace for knowledge base isolation",
    )
    async def create_workspace(request: WorkspaceCreateRequest):
        """
        Create a new workspace.

        This will create the necessary directory structure for the workspace.
        """
        try:
            name = request.name.strip()

            # Validate workspace name
            if not is_valid_workspace_name(name):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid workspace name '{name}'. Only alphanumeric characters and underscores are allowed.",
                )

            # Check if workspace already exists
            workspace_path = working_path / name
            input_workspace_path = input_path / name

            if workspace_path.exists():
                # Check if it has any data
                workspace_info = get_workspace_info(working_path, name)
                if workspace_info.document_count > 0 or workspace_info.has_graph:
                    raise HTTPException(
                        status_code=409,
                        detail=f"Workspace '{name}' already exists with data",
                    )

            # Create workspace directories
            workspace_path.mkdir(parents=True, exist_ok=True)
            input_workspace_path.mkdir(parents=True, exist_ok=True)

            # Initialize pipeline_status for the new workspace
            # This is required for the /health endpoint and other features
            await initialize_pipeline_status(workspace=name)

            logger.info(f"Created workspace: {name}")

            workspace_info = get_workspace_info(working_path, name)

            return WorkspaceCreateResponse(
                status="success",
                message=f"Workspace '{name}' created successfully",
                workspace=workspace_info,
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating workspace: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    @router.delete(
        "/workspaces/{workspace_name}",
        response_model=WorkspaceDeleteResponse,
        dependencies=[Depends(combined_auth)],
        summary="Delete a workspace",
        description="Delete a workspace and all its data",
    )
    async def delete_workspace(workspace_name: str):
        """
        Delete a workspace and all its associated data.

        WARNING: This operation is irreversible and will delete all documents,
        entities, relationships, and other data in the workspace.
        """
        try:
            name = workspace_name.strip()

            # Validate workspace name
            if not is_valid_workspace_name(name):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid workspace name '{name}'",
                )

            # Prevent deleting default workspace
            if not name or name == "(default)":
                raise HTTPException(
                    status_code=400,
                    detail="Cannot delete the default workspace",
                )

            # Check if workspace exists
            workspace_path = working_path / name
            input_workspace_path = input_path / name

            if not workspace_path.exists():
                raise HTTPException(
                    status_code=404,
                    detail=f"Workspace '{name}' not found",
                )

            # Delete workspace directories
            try:
                if workspace_path.exists():
                    shutil.rmtree(workspace_path)
                if input_workspace_path.exists():
                    shutil.rmtree(input_workspace_path)
            except Exception as e:
                logger.error(f"Error deleting workspace directories: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to delete workspace directories: {str(e)}",
                )

            logger.info(f"Deleted workspace: {name}")

            return WorkspaceDeleteResponse(
                status="success",
                message=f"Workspace '{name}' deleted successfully",
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting workspace: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    @router.get(
        "/workspaces/current",
        dependencies=[Depends(combined_auth)],
        summary="Get current workspace",
        description="Get information about the currently active workspace",
    )
    async def get_current_workspace(request: Request):
        """
        Get the current workspace based on the request header.
        """
        try:
            # Get current workspace from header or use default
            current_workspace = request.headers.get("LIGHTRAG-WORKSPACE", "").strip()
            if not current_workspace:
                current_workspace = default_workspace

            workspace_info = get_workspace_info(
                working_path, current_workspace if current_workspace else ""
            )

            return {
                "status": "success",
                "workspace": current_workspace if current_workspace else "(default)",
                "info": workspace_info,
            }
        except Exception as e:
            logger.error(f"Error getting current workspace: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    @router.get(
        "/workspaces/{workspace_name}",
        response_model=WorkspaceInfo,
        dependencies=[Depends(combined_auth)],
        summary="Get workspace info",
        description="Get detailed information about a specific workspace",
    )
    async def get_workspace(workspace_name: str):
        """
        Get information about a specific workspace.
        """
        try:
            name = workspace_name.strip()

            # Handle default workspace
            if name == "(default)":
                name = ""

            # Validate workspace name if not default
            if name and not is_valid_workspace_name(name):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid workspace name '{name}'",
                )

            # Check if workspace exists
            if name:
                workspace_path = working_path / name
                if not workspace_path.exists():
                    raise HTTPException(
                        status_code=404,
                        detail=f"Workspace '{name}' not found",
                    )

            return get_workspace_info(working_path, name)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting workspace info: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    return router

