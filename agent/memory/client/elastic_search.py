from elasticsearch import Elasticsearch

class ES_Client():
    def __init__(self, context):
        conf = context.config['memory']['elastic_search']
        self.es = Elasticsearch(
            hosts=[f"http://{conf.get('host', 'localhost')}:{conf.get('port', 9200)}"],
            basic_auth=(conf.get('username', 'elastic'), conf.get('password', 'changeme')),
            timeout=conf.get('timeout', 5000),
            verify_certs=False
        )
    
    
    def get_doc(self, index, id):
        """
        arguments: 
            index: str
            id: str
        """
        res = self.es.get(index=index, id=id)
        return res["_source"]
    
    def update_doc(self, index, id, data):
        res = self.es.update(index=index, id=id, body={"doc": data})
        return res["_id"]
    
    def batch_create_doc(self, index_name, updates):
        """
        批量更新
        index_name: 
        updates: {doc_id: dictionary_of_content}
        """
        try:
            actions = []
            for doc_id, update_data in updates.items():
                actions.append({
                    "_index": index_name,
                    "_id": doc_id,
                    "doc": update_data
                })
            
            from elasticsearch.helpers import bulk
            ret = bulk(self.es, actions,
                        stats_only=False,  # 获取详细错误信息
                        raise_on_error=False  # 不抛出异常，手动处理错误
                    )
            print("batch_create_doc ret: ",ret)
            return ret
        except Exception as e:
            print("batch_create_doc Exception Error: ", str(e))
        return 
    def delete_doc(self, index, id):
        """
        arguments: 
            index: str
            id: str
        """
        res = self.es.delete(index=index, id=id)    
        return res["_id"]
    
    def search_doc(self, index, query):
        """
        arguments: 
            index: str
            query: json
        returns:
            json: {
                "hits": {
                    "hits": [
                        {
                            "_index": "my_index",
                            "_id": "1",
                            "_score": 1.0,
                            "_source": {
                                "title": "Book 1",
                                "author": "Author 1"
                            }
                        }
                    ]
                }
            }
        """
        res = self.es.search(index=index, body=query)
        return res

    def create_doc(self, index, data, id=''):
        """
        arguments: 
            index: str
            data: json
        """
        if id == '':
            res = self.es.index(index=index, body=data)
            return res["_id"]
        res = self.es.index(index=index, id=id, body=data)
        return res["_id"]
    
    def exists(self, index):
        return self.es.indices.exists(index=index)
    
    def search(self, index, keyword, fields='content',fuzziness = "AUTO"):
        if not isinstance(fields, list):
            fields = list(fields)
        query = {
                "query": {
                    "multi_match": {
                        "query": keyword,
                        "fields": fields,
                        "fuzziness": fuzziness,
                        "type": "best_fields",
                        "operator": "or"
                    }
                }
            }

        return self.search_doc(index, query)