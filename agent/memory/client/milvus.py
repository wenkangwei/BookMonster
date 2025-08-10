# from flask import Flask, request, jsonify
from pymilvus import connections, Collection

class Milvus_Client():
    def __init__(self,context):
        conf = context.config['memory'].get("milvus")
        self.host = conf.get("host","localhost")
        self.port = conf.get("port","19530")
        self.collection_name = conf.get("collection_name","milvus_collection")
        connections.connect("default", host=self.host, port=self.port)
        self.collection = Collection(self.collection_name)  # 假设已存在

    def create_collection(self):
        self.collection.create(
            fields=[
                {"name": "id", "type": DataType.INT64, "is_primary": True},
                {"name": "vector", "type": DataType.FLOAT_VECTOR, "dim": 1536}
            ],
            primary_key_field="id",
            vector_field="vector"
        )
        self.collection.load()
    def insert_vector(self, vectors):
        res = self.collection.insert([vectors])
        return res.primary_keys[0]
    
    def search_vector(self, query_vec, topK=10):
        res = self.collection.search([query_vec], anns_field="vector", param={}, limit=topK)
        return [{"id": hit.id, "distance": hit.distance} for hit in res[0]]
    
    def delete_vector(self, id):
        expr = f"id in [{id}]"
        self.collection.delete(expr)
        return {"status": "deleted"}

    def get_vector(self, id):
        res = self.collection.query(
            expr=f"id in [{id}]",
            output_fields=["id", "vector"]
        )
        return res