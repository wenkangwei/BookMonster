import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from nltk.corpus import stopwords
from nltk.probability import FreqDist
import networkx as nx
import matplotlib.pyplot as plt

# 下载NLTK数据
nltk.download('punkt_tab')
nltk.download('punkt')
nltk.download('stopwords')

def generate_mindmap_from_text(text, output_file='mindmap.png'):
    # 分句和分词
    sentences = sent_tokenize(text)
    words = word_tokenize(text.lower())
    
    # 移除停用词和标点
    stop_words = set(stopwords.words('english') + list(".,;:!?'\"()"))
    filtered_words = [word for word in words if word.isalnum() and word not in stop_words]
    
    # 提取关键词
    freq_dist = FreqDist(filtered_words)
    keywords = [word for word, freq in freq_dist.most_common(10)]
    
    # 创建思维导图结构
    G = nx.Graph()
    central_node = "Main Topic"
    G.add_node(central_node)
    
    # 添加关键词作为主要分支
    for keyword in keywords:
        G.add_node(keyword)
        G.add_edge(central_node, keyword)
        
        # 添加包含该关键词的句子作为子节点
        related_sentences = [sent for sent in sentences if keyword in sent.lower()]
        for i, sent in enumerate(related_sentences[:3]):  # 每个关键词最多3个相关句子
            sent_node = f"{keyword}_sentence_{i}"
            G.add_node(sent_node)
            G.add_edge(keyword, sent_node)
    
    # 绘制思维导图
    plt.figure(figsize=(12, 8))
    pos = nx.spring_layout(G, k=0.5, seed=42)  # k控制节点间距
    nx.draw(G, pos, with_labels=True, node_size=3000, node_color='skyblue', 
            font_size=10, font_weight='bold', edge_color='gray')
    plt.title("Mind Map from Text", size=15)
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    plt.close()
    print(f"Mind map saved as {output_file}")


def generate_markdown_mindmap(text, output_file="mindmap.md"):
    sentences = sent_tokenize(text)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# Article Mind Map\n\n")
        f.write("## Main Topic\n")
        
        # 简单示例：每句作为一个子节点
        for i, sentence in enumerate(sentences[:10]):  # 限制数量
            f.write(f"### Point {i+1}\n")
            f.write(f"- {sentence.strip()}\n\n")
    
    print(f"Markdown mind map saved as {output_file}")

# 示例使用
article = """
Artificial intelligence (AI) is intelligence demonstrated by machines, 
unlike the natural intelligence displayed by humans and animals. 
Leading AI textbooks define the field as the study of intelligent agents: 
any system that perceives its environment and takes actions that maximize 
its chance of achieving its goals. AI applications include advanced web search 
engines, recommendation systems, understanding human speech, self-driving cars, 
automated decision-making and competing at the highest level in strategic game systems.
"""

# 使用示例
generate_markdown_mindmap(article)

# generate_mindmap_from_text(article)