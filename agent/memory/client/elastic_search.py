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
    
    def create_doc(self, index, data):
        """
        data: json
        """
        res = self.es.index(index=index, body=data)
        return res["_id"]
    
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

    def insert_doc(self, index, data, id=''):
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