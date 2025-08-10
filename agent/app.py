from memory.client.memory import MemoryClient
from common.context import Context

if __name__ == "__main__":
    context = Context()
    print("context config: ", context.config)
    memory_client = MemoryClient(context)
    memory_client.test_es()
    memory_client.test_faiss()
    memory_client.test_mysql()
    
    