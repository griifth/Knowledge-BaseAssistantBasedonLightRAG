"""
RAG Instance Manager for multi-workspace support.

This module provides a manager class that caches LightRAG instances for different workspaces,
allowing dynamic workspace switching without restarting the server.
"""

import asyncio
from typing import Dict, Optional, Any
from dataclasses import dataclass
from lightrag import LightRAG
from lightrag.utils import logger
from lightrag.kg.shared_storage import initialize_pipeline_status


@dataclass
class RAGInstanceConfig:
    """Configuration for creating LightRAG instances"""
    working_dir: str
    llm_model_func: Any
    llm_model_name: str
    llm_model_max_async: int
    summary_max_tokens: int
    summary_context_size: int
    chunk_token_size: int
    chunk_overlap_token_size: int
    llm_model_kwargs: dict
    embedding_func: Any
    default_llm_timeout: int
    default_embedding_timeout: int
    kv_storage: str
    graph_storage: str
    vector_storage: str
    doc_status_storage: str
    vector_db_storage_cls_kwargs: dict
    enable_llm_cache_for_entity_extract: bool
    enable_llm_cache: bool
    rerank_model_func: Any
    max_parallel_insert: int
    max_graph_nodes: int
    addon_params: dict
    ollama_server_infos: Any


class RAGInstanceManager:
    """
    Manager for LightRAG instances across multiple workspaces.
    
    This class maintains a cache of LightRAG instances, creating new ones
    on-demand when a workspace is first accessed.
    """
    
    def __init__(self, config: RAGInstanceConfig, default_workspace: str = ""):
        """
        Initialize the RAG instance manager.
        
        Args:
            config: Configuration for creating LightRAG instances
            default_workspace: The default workspace name
        """
        self.config = config
        self.default_workspace = default_workspace
        self._instances: Dict[str, LightRAG] = {}
        self._locks: Dict[str, asyncio.Lock] = {}
        self._global_lock = asyncio.Lock()
    
    async def get_instance(self, workspace: Optional[str] = None) -> LightRAG:
        """
        Get or create a LightRAG instance for the specified workspace.
        
        Args:
            workspace: The workspace name. If None or empty, uses the default workspace.
        
        Returns:
            LightRAG instance for the specified workspace
        """
        # Normalize workspace name
        ws = workspace if workspace else self.default_workspace
        
        # Fast path: instance already exists
        if ws in self._instances:
            return self._instances[ws]
        
        # Slow path: need to create instance
        async with self._global_lock:
            # Double-check after acquiring lock
            if ws in self._instances:
                return self._instances[ws]
            
            # Create lock for this workspace if not exists
            if ws not in self._locks:
                self._locks[ws] = asyncio.Lock()
        
        # Create instance with workspace-specific lock
        async with self._locks[ws]:
            # Triple-check after acquiring workspace lock
            if ws in self._instances:
                return self._instances[ws]
            
            logger.info(f"Creating LightRAG instance for workspace: {ws or '(default)'}")
            
            try:
                # Create new instance
                instance = LightRAG(
                    working_dir=self.config.working_dir,
                    workspace=ws,
                    llm_model_func=self.config.llm_model_func,
                    llm_model_name=self.config.llm_model_name,
                    llm_model_max_async=self.config.llm_model_max_async,
                    summary_max_tokens=self.config.summary_max_tokens,
                    summary_context_size=self.config.summary_context_size,
                    chunk_token_size=self.config.chunk_token_size,
                    chunk_overlap_token_size=self.config.chunk_overlap_token_size,
                    llm_model_kwargs=self.config.llm_model_kwargs,
                    embedding_func=self.config.embedding_func,
                    default_llm_timeout=self.config.default_llm_timeout,
                    default_embedding_timeout=self.config.default_embedding_timeout,
                    kv_storage=self.config.kv_storage,
                    graph_storage=self.config.graph_storage,
                    vector_storage=self.config.vector_storage,
                    doc_status_storage=self.config.doc_status_storage,
                    vector_db_storage_cls_kwargs=self.config.vector_db_storage_cls_kwargs,
                    enable_llm_cache_for_entity_extract=self.config.enable_llm_cache_for_entity_extract,
                    enable_llm_cache=self.config.enable_llm_cache,
                    rerank_model_func=self.config.rerank_model_func,
                    max_parallel_insert=self.config.max_parallel_insert,
                    max_graph_nodes=self.config.max_graph_nodes,
                    addon_params=self.config.addon_params,
                    ollama_server_infos=self.config.ollama_server_infos,
                )
                
                # Initialize storages
                await instance.initialize_storages()
                
                # Cache the instance
                self._instances[ws] = instance
                
                logger.info(f"LightRAG instance for workspace '{ws or '(default)'}' initialized successfully")
                
                return instance
                
            except Exception as e:
                logger.error(f"Failed to create LightRAG instance for workspace '{ws}': {e}")
                raise
    
    def get_default_instance(self) -> Optional[LightRAG]:
        """
        Get the default workspace instance if it exists.
        
        Returns:
            The default LightRAG instance or None if not initialized
        """
        return self._instances.get(self.default_workspace)
    
    def set_default_instance(self, instance: LightRAG):
        """
        Set the default workspace instance.
        
        This is useful for setting the initial instance created during server startup.
        
        Args:
            instance: The LightRAG instance to set as default
        """
        self._instances[self.default_workspace] = instance
    
    async def finalize_all(self):
        """
        Finalize all cached LightRAG instances.
        
        Should be called during server shutdown.
        """
        for ws, instance in self._instances.items():
            try:
                logger.info(f"Finalizing LightRAG instance for workspace: {ws or '(default)'}")
                await instance.finalize_storages()
            except Exception as e:
                logger.error(f"Error finalizing workspace '{ws}': {e}")
    
    @property
    def workspaces(self) -> list:
        """Get list of currently loaded workspaces"""
        return list(self._instances.keys())
    
    @property
    def instance_count(self) -> int:
        """Get number of cached instances"""
        return len(self._instances)

