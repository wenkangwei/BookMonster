import os
import numpy as np
import faiss



class Faiss_Client():
    def __init__(self, context):
        conf = context.config['memory']['faiss']
        self.data_root = conf.get('data_root', './data')
        self.index_path = os.path.join(self.data_root, "faiss_index.bin")
        self.dim = conf.get('dim', 128)
        # self.index.nprobe = conf.get('nprobe', 10)
        self.embeddings = None
        self.ids = {}
    
        if not os.path.exists(self.data_root):
            os.makedirs(self.data_root)
        if not os.path.exists(self.index_path):
            self.index = faiss.IndexFlatL2(self.dim)
        else:
            self.index = faiss.read_index(self.index_path)
            print("faiss index loaded")
            print("FAISS 索引信息:")
            print(f"- 向量数量 (ntotal): {self.index.ntotal}")  # 索引中的向量总数
            print(f"- 向量维度 (d): {self.index.d}")           # 每个向量的维度
            print(f"- 是否已训练 (is_trained): {self.index.is_trained}")  # 索引是否已训练（如 IVF 需要训练）
            print(f"- 度量方式 (metric_type): {self.index.metric_type}")  # 0
            self.embeddings = self.index.reconstruct_n(0, self.index.ntotal)
            self.dim = self.index.d
            self.id2idx = {id: i for i, id in enumerate(self.ids)}
            self.ids = {i: id for i, id in enumerate(self.ids)}
        
    def remove_index(self, id):
        idx = self.id2idx.get(id,'')
        if idx!='':
            self.ids.pop(idx)
            self.id2idx.pop(id)
        self.index.remove_ids(np.array([id]))
        return

    def insert_vector(self, vectors):
        self.embeddings = vectors['embeddings']
        self.ids = {i: id for i, id in enumerate(vectors['ids'])}
        self.id2idx = {id: i for i, id in enumerate(vectors['ids'])}
        embs = np.array(self.embeddings, dtype='float32')
        if not self.index.is_trained:
            self.index.train(embs)  # 对于某些索引类型需要训练
        self.index.add(embs)
       
        # check if file exist after save
        # self.save_index()
        return  

    def search_vector(self, query_vec, topK=10):
        query_vec = np.array(query_vec, dtype='float32').reshape(1, -1)
        distances, indices = self.index.search(query_vec, topK)
        ids = [self.ids[ int(i)] for i in indices[0] if int(i) in self.ids]
        return ids, distances[0].tolist()
    
    def save_index(self):
        faiss.write_index(self.index, self.index_path)
        return os.path.exists(self.index_path)
