# from .faiss import Faiss_Client
# from .elastic_search import ES_Client
# from .mysql import MySQL_Client
# from .redis import Reids_Client
# from .milvus import Milvus_Client

import os
import sys
import json
from memory.client.faiss import Faiss_Client
from  memory.client.elastic_search import ES_Client
from memory.client.mysql import MySQL_Client
from  memory.client.redis import Reids_Client
from  memory.client.milvus import Milvus_Client
from common.context import Context
import numpy as np

class MemoryClient:
    def __init__(self, context):
        self.es_client = ES_Client (context)
        self.redis_client = Reids_Client(context)
        self.mysql_client = MySQL_Client(context)
        self.faiss_client = Faiss_Client(context)
        # self.milvus_client = Milvus_Client(context)

    def test_es(self):
        data = {"title":"Test", "content":"Hello"}
        index= "test_index"
        # create
        _id = self.es_client.create_doc(index, data)
        print("create doc done with id: ",_id)
        # check
        self.es_client.es.indices.exists(index=index)
        print("index exists: ",self.es_client.es.indices.exists(index=index))
        query = {
            "size": 1,
            "query": {
                "match": {
                    "title": "Test"
                }
            }
        }

        # search
        res = self.es_client.search_doc(index,query) 
        print("origin:",res)
        if len(res["hits"]["hits"]) > 0:
            _id = res["hits"]["hits"][0]["_id"]
            print("origin _id: ",_id)
        else:
            _id = None
        print("_id: ",_id)
        # update
        if _id:
            self.es_client.update_doc(index,_id,{"title":"Test2"})
            print("updated: ",res)  
        res = self.es_client.search_doc(index,query)
        print("search result: ",res)

        # delete
        if _id:
            self.es_client.delete_doc(index,_id)
        else:
            print("Skip deletion. No document found.")
        res = self.es_client.search_doc(index,query)
        print("deleted: ",res)
        self.es_client.es.indices.delete(index=index)
        print("index deleted: ",self.es_client.es.indices.exists(index=index))
    
    def test_faiss(self):
        embeddings = np.random.random((1000, 128))
        print("embeddings: ",embeddings.shape)
        idx = [ str(np.random.randint(0, 1000))  for i in range(len(embeddings))]
        print("idx: ",len(idx))
        matrix = {
            "embeddings": embeddings,
            "ids": idx
        }
        self.faiss_client.insert_vector(matrix)

        query_emb = np.random.random((1, 128))
        res = self.faiss_client.search_vector(query_emb)
        print("faiss res: ",res)
        self.faiss_client.remove_index(idx[0])
        ret = self.faiss_client.save_index()
        print("save index ret: ",ret)


    def test_redis(self):
        self.redis_client.set("test_key","test_value")
        res = self.redis_client.get("test_key")
        print(res)
        self.redis_client.delete("test_key")
        try:
            res = self.redis_client.get("test_key")
            print(res)
        except:
            print("key not found")
    
    def test_mysql(self):
        #create table
        self.mysql_client.create_table('test_tb',{
            'monster_id': 'INT AUTO_INCREMENT PRIMARY KEY',
            'monster_name': 'VARCHAR(255)',
            'monster_attribute':'VARCHAR(255)',
            "maxHp":'INT',
            "image_url":'VARCHAR(255)',
            "attack":'INT',
            "defense":'INT',
            "level":'INT',
            "exp":'INT',
            "description":'VARCHAR(255)',
            'question': 'VARCHAR(255)',
            'answer_list': 'JSON',
            'create_time': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
            'update_time': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'

        })
        print("table created")
        # generate fake data rows
        data_rows = []
        for i in range(1000):
            data_rows.append({
                "monster_name": f"monster_{i}",
                "monster_attribute": f"attribute_{i}",
                "maxHp": 100,
                "image_url": f"https://example.com/image_{i}.jpg",
                "attack": 10,
                "defense": 5,
                "level": 1,
                "exp": 0,
                "description": f"description_{i}",
                "question": f"question_{i}",
                "answer_list": json.dumps([f"answer_{i}_{j}" for j in range(3)])
            })
        print("data_rows: ",len(data_rows))
        # insert
        self.mysql_client.create_record('test_tb',data_rows)
        # read rows
        res = self.mysql_client.query_record('test_tb',"monster_name='monster_1'")
        print("read rows: ",res)
        # update
        self.mysql_client.update_record('test_tb', data_rows[0],"monster_name='monster_1'")
        print("updated rows: ",res)
        # delete
        self.mysql_client.delete_record('test_tb',"monster_name='monster_2'")
        print("deleted rows: ",res)
        res = self.mysql_client.sql("SELECT * FROM test_tb")
        print("All data: ", res)
        #close
        self.mysql_client.close()
        print("mysql client closed")

# if __name__ == "__main__":
#     context = Context("../../config/config.yaml")
#     print("context config: ", context.config)
#     memory_client = MemoryClient(context)
#     memory_client.test_es()
#     memory_client.test_faiss()
#     memory_client.test_mysql()