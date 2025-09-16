#!/usr/bin/env python
# -*- coding: utf-8 -*-
'''
@File    :   pdf_reader.py
@Time    :   2025/08/16 19:21
@Author  :   weiwenkang
@Version :   1.1
@Desc    :   None
'''

import enum
import os
from typing import Dict, List, Optional, Tuple, Union

from PyPDF2 import PdfReader, PdfWriter

import PyPDF2
import markdown
import json
from tqdm import tqdm
import tiktoken
from bs4 import BeautifulSoup
import re

enc = tiktoken.get_encoding("cl100k_base")


import fitz
import re
from typing import List, Dict, Optional


import fitz  # PyMuPDF
import os
import json
from typing import List, Dict
from PIL import Image
import io


import fitz  # PyMuPDF
import re
import os
from typing import List, Dict, Optional, Tuple
import json



from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import json

class MultiFormatParser:
    def __init__(self, file_path: str, image_output_dir: str = ""):
        """
        初始化多格式解析器
        :param file_path: 输入文件路径（支持PDF/HTML/MD/TXT）
        :param image_output_dir: 图片输出目录
        """
        self.file_path = file_path
        self.image_output_dir = image_output_dir
        if self.image_output_dir:
            os.makedirs(self.image_output_dir, exist_ok=True)
        
        self.file_type = self._detect_file_type()
        self.sections: List[Dict] = []
        self.image_metadata: List[Dict] = []
        self.image_counter = 0
        
        self.current_section = None
        # 公共正则表达式
        self.header_pattern = re.compile(r'^(#+\s*)?(?P<num>\d+(\.\d+)*)?\s*(?P<title>.+)$')
    
    def _detect_file_type(self) -> str:
        """检测文件类型"""
        ext = Path(self.file_path).suffix.lower()
        if ext == '.pdf':
            return 'pdf'
        elif ext in ('.html', '.htm'):
            return 'html'
        elif ext == '.md':
            return 'markdown'
        else:
            # 默认为纯文本
            return 'text'
    
    def parse(self) -> Tuple[List[Dict], List[Dict]]:
        """
        解析文件并提取结构化内容
        :return: (sections, image_metadata)
        """
        if self.file_type == 'pdf':
            return self._parse_pdf()
        elif self.file_type == 'html':
            return self._parse_html()
        elif self.file_type == 'markdown':
            return self._parse_markdown()
        else:
            return self._parse_text()
    
    def _parse_pdf(self) -> Tuple[List[Dict], List[Dict]]:
        """解析PDF文件"""
        doc = fitz.open(self.file_path)
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            blocks = page.get_text("dict", sort=True)["blocks"]
            
            for block in blocks:
                if block["type"] == 0:  # 文本块
                    self._process_pdf_text_block(block, page_num)
                elif block["type"] == 1:  # 图片块
                    self._process_pdf_image_block(block, page_num)
        
        # 确保添加最后一个section
        self._finalize_current_section()
        doc.close()
        return self.sections, self.image_metadata
    
    def _process_pdf_text_block(self, block, page_num: int):
        """处理PDF文本块"""
        full_text = ""
        has_bold = False
        bold_text = ""
        
        for line in block["lines"]:
            for span in line["spans"]:
                text = span["text"]
                full_text += text
                
                # 检测加粗
                is_bold = (span["flags"] & 16) or ("Bold" in span["font"])
                if is_bold:
                    has_bold = True
                    bold_text += text
        
        # 判断是否是标题行
        if has_bold and self._is_header(bold_text.strip(), full_text.strip()):
            self._start_new_section(bold_text.strip())
        else:
            self._add_to_current_section(full_text)
    
    def _process_pdf_image_block(self, block, page_num: int):
        """处理PDF图片块"""
        images = block.get("images", [])
        if not images:
            return
        
        # 提取第一张图片
        img_info = images[0]
        xref = img_info["xref"]
        
        try:
            base_image = self.doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            # 保存图片
            self.image_counter += 1
            img_file_name = f"img_pdf_{page_num+1}_{self.image_counter}.{image_ext}"
            img_path = os.path.join(self.image_output_dir, img_file_name)
            if self.image_output_dir:
                with open(img_path, "wb") as f:
                    f.write(image_bytes)
            
            # 记录图片元数据
            img_meta = {
                "file_name": img_file_name,
                "path": img_path,
                "width": base_image["width"],
                "height": base_image["height"],
                "page": page_num + 1,
                "source": "pdf"
            }
            self.image_metadata.append(img_meta)
            
            # 在内容中插入图片标记
            if self.current_section:
                img_marker = f" <IMAGE_START>{img_file_name}<IMAGE_END> "
                self.current_section["content"] += img_marker
                
                if "images" not in self.current_section:
                    self.current_section["images"] = []
                self.current_section["images"].append({
                    "position": len(self.current_section["content"]),
                    "image_info": img_meta
                })
                
        except Exception as e:
            print(f"提取PDF图片失败: {e}")
    
    def _parse_html(self) -> Tuple[List[Dict], List[Dict]]:
        """解析HTML文件"""
        with open(self.file_path, 'r', encoding='utf-8') as f:
            soup = BeautifulSoup(f.read(), 'html.parser')
        
        # 提取所有标题和内容
        for header in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
            self._start_new_section(header.get_text().strip())
            
            # 获取标题后的内容直到下一个标题
            next_node = header.next_sibling
            content = ""
            
            while next_node and next_node.name not in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                content += str(next_node)
                next_node = next_node.next_sibling
            
            self._add_to_current_section(content)
        
        # 提取图片
        for img in soup.find_all('img'):
            src = img.get('src')
            if not src:
                continue
                
            self.image_counter += 1
            img_file_name = f"img_html_{self.image_counter}_{os.path.basename(src)}"
            img_path = os.path.join(self.image_output_dir, img_file_name)
            
            # 这里可以添加实际下载图片的逻辑
            # 现在只是记录位置信息
            
            img_meta = {
                "file_name": img_file_name,
                "original_src": src,
                "path": img_path,
                "source": "html"
            }
            self.image_metadata.append(img_meta)
            
            # 在最近section中添加图片标记
            if self.sections:
                self.sections[-1]["content"] += f" <IMAGE_START>{img_file_name}<IMAGE_END> "
                
                if "images" not in self.sections[-1]:
                    self.sections[-1]["images"] = []
                self.sections[-1]["images"].append({
                    "position": len(self.sections[-1]["content"]),
                    "image_info": img_meta
                })
        
        return self.sections, self.image_metadata
    
    def _parse_markdown(self) -> Tuple[List[Dict], List[Dict]]:
        """解析Markdown文件"""
        with open(self.file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        current_section = None
        content = ""
        
        for line in lines:
            # 检测Markdown标题
            if line.startswith('#'):
                # 保存前一个section
                if current_section and content.strip():
                    self.sections.append({
                        "title": current_section,
                        "content": content.strip(),
                        "images": []  # Markdown图片将在后续处理
                    })
                
                # 开始新section
                current_section = line.lstrip('#').strip()
                content = ""
            else:
                content += line
        
        # 保存最后一个section
        if current_section and content.strip():
            self.sections.append({
                "title": current_section,
                "content": content.strip(),
                "images": []
            })
        
        # 提取Markdown中的图片
        for i, section in enumerate(self.sections):
            # 查找Markdown图片语法: ![alt](src)
            images = re.finditer(r'!\[.*?\]\((.*?)\)', section["content"])
            
            for match in images:
                src = match.group(1)
                self.image_counter += 1
                img_file_name = f"img_md_{i+1}_{self.image_counter}_{os.path.basename(src)}"
                img_path = os.path.join(self.image_output_dir, img_file_name)
                
                img_meta = {
                    "file_name": img_file_name,
                    "original_src": src,
                    "path": img_path,
                    "source": "markdown"
                }
                self.image_metadata.append(img_meta)
                
                # 替换图片标记
                section["content"] = section["content"].replace(
                    match.group(0),
                    f" <IMAGE_START>{img_file_name}<IMAGE_END> "
                )
                
                # 记录图片位置
                pos = section["content"].find(f"<IMAGE_START>{img_file_name}<IMAGE_END>")
                if pos != -1:
                    if "images" not in section:
                        section["images"] = []
                    section["images"].append({
                        "position": pos,
                        "image_info": img_meta
                    })
        
        return self.sections, self.image_metadata
    
    def _parse_text(self) -> Tuple[List[Dict], List[Dict]]:
        """解析纯文本文件"""
        with open(self.file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 简单地将整个文件作为一个section
        self.sections.append({
            "title": Path(self.file_path).stem,
            "content": content,
            "images": []
        })
        
        return self.sections, self.image_metadata
    
    def _is_header(self, text: str, full_text: str) -> bool:
        """判断是否为标题"""
        # 排除过长文本
        if len(text) > 50 or full_text.isupper():
            return False
        
        # 检查是否符合标题模式
        match = self.header_pattern.match(text)
        if match and (match.group("num") or len(text.split()) < 5):
            return True
        
        return len(text.split()) < 6
    
    def _start_new_section(self, title: str):
        """开始新的section"""
        if self.current_section:
            self._finalize_current_section()
        
        self.current_section = {
            "title": title,
            "content": "",
            "images": []
        }
    
    def _add_to_current_section(self, text: str):
        """添加内容到当前section"""
        if self.current_section:
            self.current_section["content"] += text
    
    def _finalize_current_section(self):
        """完成当前section的处理"""
        if self.current_section and self.current_section["content"].strip():
            # 清理内容中的多余空行
            self.current_section["content"] = "\n".join(
                line.strip() for line in self.current_section["content"].splitlines() 
                if line.strip()
            )
            self.sections.append(self.current_section)
        self.current_section = None
    
    def export_results(self, format: str = "all", output_dir: str = None) -> Dict:
        """
        导出解析结果
        :param format: 导出格式 (html/markdown/text/all)
        :param output_dir: 自定义输出目录
        :return: 各格式文件的路径字典
        """
        if output_dir is None:
            output_dir = self.output_dir
        os.makedirs(output_dir, exist_ok=True)
        
        base_name = Path(self.file_path).stem
        export_paths = {}
        
        def save_html():
            path = os.path.join(output_dir, f"{base_name}.html")
            with open(path, 'w', encoding='utf-8') as f:
                f.write(self._generate_html())
            export_paths['html'] = path
        
        def save_markdown():
            path = os.path.join(output_dir, f"{base_name}.md")
            with open(path, 'w', encoding='utf-8') as f:
                f.write(self._generate_markdown())
            export_paths['markdown'] = path
        
        def save_text():
            path = os.path.join(output_dir, f"{base_name}.txt")
            with open(path, 'w', encoding='utf-8') as f:
                f.write(self._generate_text())
            export_paths['text'] = path
        
        if format == "html":
            save_html()
        elif format == "markdown":
            save_markdown()
        elif format == "text":
            save_text()
        else:  # all
            save_html()
            save_markdown()
            save_text()
        
        # 保存元数据
        meta_path = os.path.join(output_dir, f"{base_name}_meta.json")
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump({
                "sections": self.sections,
                "images": self.image_metadata
            }, f, ensure_ascii=False, indent=2)
        
        export_paths['metadata'] = meta_path
        return export_paths
    
    def _generate_html(self) -> str:
        """生成HTML格式内容"""
        html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Document Export</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
        h2 { color: #2980b9; border-bottom: 1px solid #3498db; padding-bottom: 3px; }
        .image-placeholder { 
            background: #f5f5f5; 
            border: 1px dashed #ccc; 
            padding: 10px; 
            margin: 10px 0;
            text-align: center;
        }
    </style>
</head>
<body>
"""
        for section in self.sections:
            level = min(6, section["title"].count('#') + 1) if section["title"].startswith('#') else 2
            title = section["title"].lstrip('#').strip()
            html += f"<h{level}>{title}</h{level}>\n"
            
            # 处理内容中的图片标记
            content = section["content"]
            content = re.sub(
                r'<IMAGE_START>(.*?)<IMAGE_END>',
                lambda m: f'<div class="image-placeholder">Image: {m.group(1)}</div>',
                content
            )
            
            html += f"<div>{content}</div>\n"
        
        html += "</body>\n</html>"
        return html
    
    def _generate_markdown(self) -> str:
        """生成Markdown格式内容"""
        md = ""
        for section in self.sections:
            # 判断标题级别
            if section["title"].startswith('#'):
                title = section["title"]  # 保留原有的Markdown标题格式
            else:
                title = f"## {section["title"]}"  # 默认二级标题
            
            md += f"{title}\n\n"
            
            # 处理内容中的图片标记
            content = section["content"]
            content = re.sub(
                r'<IMAGE_START>(.*?)<IMAGE_END>',
                lambda m: f'![image]({m.group(1)})',
                content
            )
            
            md += f"{content}\n\n"
        
        return md.strip()
    
    def _generate_text(self) -> str:
        """生成纯文本格式内容"""
        text = ""
        for section in self.sections:
            text += f"{section["title"]}\n"
            text += "=" * len(section["title"]) + "\n\n"
            
            # 移除图片标记或替换为简单文本
            content = re.sub(
                r'<IMAGE_START>(.*?)<IMAGE_END>',
                lambda m: f"[Image: {m.group(1)}]",
                section["content"]
            )
            
            text += f"{content}\n\n"
        
        return text.strip()



class PDFSectionExtractor:
    def __init__(self, pdf_path: str, image_output_dir: str = ""):
        """
        初始化PDF提取器
        :param pdf_path: PDF文件路径
        :param image_output_dir: 图片输出目录
        """
        self.doc = fitz.open(pdf_path)
        self.image_output_dir = image_output_dir
        if self.image_output_dir:
            os.makedirs(self.image_output_dir, exist_ok=True)
        
        self.sections: List[Dict] = []
        self.current_section: Optional[Dict] = None
        self.header_pattern = re.compile(r'^(?P<num>\d+(\.\d+)*)?\s*(?P<title>.+)$')
        self.image_counter = 0
        self.image_metadata = []
    
    def extract(self) -> Tuple[List[Dict], List[Dict]]:
        """
        主提取方法
        :return: (sections, image_metadata)
        """
        for page_num in range(len(self.doc)):
            page = self.doc.load_page(page_num)
            self._process_page(page, page_num)
        
        # 确保添加最后一个section
        if self.current_section and self.current_section["content"].strip():
            self._finalize_current_section()
        
        # 保存图片元数据
        if self.image_output_dir:
            self._save_image_metadata()
        
        # 转换所有set为list以便JSON序列化
        for section in self.sections:
            if "page_numbers" in section:
                section["page_numbers"] = sorted(section["page_numbers"])
        
        return self.sections, self.image_metadata
    
    def _process_page(self, page, page_num: int):
        """处理单个页面"""
        blocks = page.get_text("dict", sort=True)["blocks"]
        
        for block in blocks:
            if block["type"] == 0:  # 文本块
                self._process_text_block(block, page_num)
            elif block["type"] == 1:  # 图片块
                self._process_image_block(block, page_num)
    
    def _process_text_block(self, block, page_num: int):
        """处理文本块"""
        full_text = ""
        has_bold = False
        bold_text = ""
        
        for line in block["lines"]:
            for span in line["spans"]:
                text = span["text"]
                full_text += text
                
                # 检测加粗
                is_bold = (span["flags"] & 16) or ("Bold" in span["font"])
                if is_bold:
                    has_bold = True
                    bold_text += text
        
        # 判断是否是标题行
        if has_bold and self._is_header(bold_text.strip(), full_text.strip()):
            self._start_new_section(bold_text.strip())
        else:
            self._add_to_current_section(full_text)
    
    def _process_image_block(self, block, page_num: int):
        """处理图片块并插入位置标记"""
        images = block.get("images", [])
        if not images:
            return
        
        # 提取第一张图片（一个块可能包含多张图片）
        img_info = images[0]
        xref = img_info["xref"]
        
        try:
            # 提取图片数据
            base_image = self.doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]
            
            # 生成唯一文件名
            self.image_counter += 1
            
            img_file_name = f"img_{page_num+1}_{self.image_counter}.{image_ext}"
            img_path = os.path.join(self.image_output_dir, img_file_name)
            
            # 保存图片
            if self.image_output_dir:
                with open(img_path, "wb") as f:
                    f.write(image_bytes)
            
            # 记录图片元数据
            img_meta = {
                "file_name": img_file_name,
                "path": img_path,
                "width": base_image["width"],
                "height": base_image["height"],
                "bbox": list(block["bbox"]),  # 转换为list确保可序列化
                "page": page_num + 1,
                "xref": xref
            }
            self.image_metadata.append(img_meta)
            
            # 在当前section内容中插入图片标记
            if self.current_section:
                img_marker = f" <IMAGE_START>{img_file_name}<IMAGE_END> "
                self.current_section["content"] += img_marker
                
                # 记录图片在section中的位置
                if "images" not in self.current_section:
                    self.current_section["images"] = []
                self.current_section["images"].append({
                    "position": len(self.current_section["content"]),
                    "image_info": img_meta
                })
                
                # 记录页面号
                self.current_section["page_numbers"].add(page_num + 1)
                
        except Exception as e:
            print(f"提取图片失败 (Page {page_num+1}, XREF {xref}): {e}")
    
    def _is_header(self, bold_text: str, full_text: str) -> bool:
        """判断是否为section标题"""
        # 排除页眉页脚
        if len(bold_text) > 50 or full_text.isupper():
            return False
        
        # 检查是否符合标题模式 (如"1.2 简介")
        match = self.header_pattern.match(bold_text)
        if match and (match.group("num") or len(bold_text.split()) < 5):
            return True
        
        # 特殊规则: 短文本且位于页面顶部区域
        return len(bold_text.split()) < 6
    
    def _start_new_section(self, title: str):
        """开始新的section"""
        if self.current_section:
            self._finalize_current_section()
        
        self.current_section = {
            "title": title,
            "content": "",
            "page_numbers": set(),  # 内部使用set去重
            "images": []
        }
    
    def _add_to_current_section(self, text: str):
        """添加内容到当前section"""
        if self.current_section:
            self.current_section["content"] += text + "\n"
    
    def _finalize_current_section(self):
        """完成当前section的处理"""
        if self.current_section["content"].strip():
            # 清理内容中的多余空行
            self.current_section["content"] = "\n".join(
                line.strip() for line in self.current_section["content"].splitlines() 
                if line.strip()
            )
            # 转换set为list
            self.current_section["page_numbers"] = sorted(self.current_section["page_numbers"])
            self.sections.append(self.current_section)
        self.current_section = None
    
    def _save_image_metadata(self):
        """保存图片元数据到JSON文件"""
        meta_path = os.path.join(self.image_output_dir, "images_metadata.json")
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump(self.image_metadata, f, ensure_ascii=False, indent=2)
    
    def close(self):
        """关闭PDF文档"""
        self.doc.close()

def process_pdf_with_images(pdf_path, output_dir="extracted_content"):
    extractor = PDFSectionExtractor(pdf_path, os.path.join(output_dir, "images"))
    try:
        sections, image_metadata = extractor.extract()
        
        for i, sec in enumerate(sections):
            if i >10:
                break
            print(f"##Section :{i}")
            print(f"title: {sec['title']}")
            print(f"page_numbers: {sec['page_numbers']}")
            print(f"content: {sec['content'][:100]} \n ....\n {sec['content'][-100:]}")
        # 打印结果示例
        print(f"提取了 {len(sections)} 个章节和 {len(image_metadata)} 张图片")
        
        # 保存完整结果
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            
            # 自定义JSON序列化函数
            def default_serializer(obj):
                if isinstance(obj, set):
                    return sorted(obj)
                raise TypeError(f"Object of type {type(obj)} is not JSON serializable")
            
            with open(os.path.join(output_dir, "sections.json"), "w", encoding="utf-8") as f:
                json.dump(sections, f, ensure_ascii=False, indent=2, default=default_serializer)
            
            print(f"\n处理完成！结果已保存到: {output_dir}")
        return sections, image_metadata
    finally:
        extractor.close()







class ReadFiles:
    """
    class to read files
    """

    def __init__(self, path: str) -> None:
        self._path = path
        self.file_list = self.get_files()

    def get_files(self):
        # args：dir_path，目标文件夹路径
        file_list = []
        for filepath, dirnames, filenames in os.walk(self._path):
            # os.walk 函数将递归遍历指定文件夹
            for filename in filenames:
                # 通过后缀名判断文件类型是否满足要求
                if filename.endswith(".md"):
                    # 如果满足要求，将其绝对路径加入到结果列表
                    file_list.append(os.path.join(filepath, filename))
                elif filename.endswith(".txt"):
                    file_list.append(os.path.join(filepath, filename))
                elif filename.endswith(".pdf"):
                    file_list.append(os.path.join(filepath, filename))
        return file_list

    def get_content(self, max_token_len: int = 600, cover_content: int = 150):
        docs = []
        # 读取文件内容
        for file in self.file_list:
            content = self.read_file_content(file)
            chunk_content = self.get_chunk(
                content, max_token_len=max_token_len, cover_content=cover_content)
            docs.extend(chunk_content)
        return docs

    @classmethod
    def get_chunk(cls, text: str, max_token_len: int = 600, cover_content: int = 150):
        chunk_text = []

        curr_len = 0
        curr_chunk = ''

        token_len = max_token_len - cover_content
        lines = text.splitlines()  # 假设以换行符分割文本为行

        for line in lines:
            # 保留空格，只移除行首行尾空格
            line = line.strip()
            line_len = len(enc.encode(line))
            
            if line_len > max_token_len:
                # 如果单行长度就超过限制，则将其分割成多个块
                # 先保存当前块（如果有内容）
                if curr_chunk:
                    chunk_text.append(curr_chunk)
                    curr_chunk = ''
                    curr_len = 0
                
                # 将长行按token长度分割
                line_tokens = enc.encode(line)
                num_chunks = (len(line_tokens) + token_len - 1) // token_len
                
                for i in range(num_chunks):
                    start_token = i * token_len
                    end_token = min(start_token + token_len, len(line_tokens))
                    
                    # 解码token片段回文本
                    chunk_tokens = line_tokens[start_token:end_token]
                    chunk_part = enc.decode(chunk_tokens)
                    
                    # 添加覆盖内容（除了第一个块）
                    if i > 0 and chunk_text:
                        prev_chunk = chunk_text[-1]
                        cover_part = prev_chunk[-cover_content:] if len(prev_chunk) > cover_content else prev_chunk
                        chunk_part = cover_part + chunk_part
                    
                    chunk_text.append(chunk_part)
                
                # 重置当前块状态
                curr_chunk = ''
                curr_len = 0
                
            elif curr_len + line_len + 1 <= token_len:  # +1 for newline
                # 当前行可以加入当前块
                if curr_chunk:
                    curr_chunk += '\n'
                    curr_len += 1
                curr_chunk += line
                curr_len += line_len
            else:
                # 当前行无法加入当前块，开始新块
                if curr_chunk:
                    chunk_text.append(curr_chunk)
                
                # 开始新块，添加覆盖内容
                if chunk_text:
                    prev_chunk = chunk_text[-1]
                    cover_part = prev_chunk[-cover_content:] if len(prev_chunk) > cover_content else prev_chunk
                    curr_chunk = cover_part + '\n' + line
                    curr_len = len(enc.encode(cover_part)) + 1 + line_len
                else:
                    curr_chunk = line
                    curr_len = line_len

        # 添加最后一个块（如果有内容）
        if curr_chunk:
            chunk_text.append(curr_chunk)

        return chunk_text

    @classmethod
    def read_file_content(cls, file_path: str):
        # 根据文件扩展名选择读取方法
        if file_path.endswith('.pdf'):
            return cls.read_pdf(file_path)
        elif file_path.endswith('.md'):
            return cls.read_markdown(file_path)
        elif file_path.endswith('.txt'):
            return cls.read_text(file_path)
        else:
            raise ValueError("Unsupported file type")

    @classmethod
    def read_pdf(cls, file_path: str):
        # 读取PDF文件
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page_num in range(len(reader.pages)):
                text += reader.pages[page_num].extract_text()
            return text

    @classmethod
    def read_markdown(cls, file_path: str):
        # 读取Markdown文件
        with open(file_path, 'r', encoding='utf-8') as file:
            md_text = file.read()
            html_text = markdown.markdown(md_text)
            # 使用BeautifulSoup从HTML中提取纯文本
            soup = BeautifulSoup(html_text, 'html.parser')
            plain_text = soup.get_text()
            # 使用正则表达式移除网址链接
            text = re.sub(r'http\S+', '', plain_text) 
            return text

    @classmethod
    def read_text(cls, file_path: str):
        # 读取文本文件
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read()

    def split_by_outline(self, input_pdf, output_dir=""):
        """根据PDF目录/书签结构拆分章节"""
        reader = PdfReader(input_pdf)
        
        if not reader.outline:
            raise ValueError("该PDF没有目录/书签结构")
        
        # os.makedirs(output_dir, exist_ok=True)
        
        # 获取所有书签及其对应页码
        bookmarks = []
        def process_bookmark(item, level=0):
            if isinstance(item, list):
                for child in item:
                    process_bookmark(child, level+1)
            elif hasattr(item, 'title'):
                page_num = reader.get_destination_page_number(item)
                bookmarks.append((item.title, page_num))
        
        process_bookmark(reader.outline)
        
        # 按书签拆分章节
        
        for i, (title, start_page) in enumerate(bookmarks):
            writer = PdfWriter()
            end_page = bookmarks[i+1][1] if i+1 < len(bookmarks) else len(reader.pages)
            res = []
            for page_num in range(start_page, end_page):
                writer.add_page(reader.pages[page_num])
                res.append(reader.pages[page_num])
            # 清理文件名中的非法字符
            clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '_'))
            # output_path = os.path.join(output_dir, f"{i+1:02d}_{clean_title}.pdf")
            
            # with open(output_path, "wb") as f:
            #     writer.write(f)
            # print(f"已保存章节: {clean_title} (页 {start_page+1}-{end_page})")
            print("=================================")
            print("res len: " , len(res))
            # print("res[0]: ", res[0].extract_text())
            print("all res: ", " ".join([res[k].extract_text() for k in range(len(res))]))



class Documents:
    """
        获取已分好类的json格式文档
    """
    def __init__(self, path: str = '') -> None:
        self.path = path
    
    def get_content(self):
        with open(self.path, mode='r', encoding='utf-8') as f:
            content = json.load(f)
        return content



if __name__ == '__main__':
    # path = "/home/wwk/workspace/ai_project/BookMonster/data/upload/"
    # read_files = ReadFiles(path)
    # print(read_files.get_files())
    # chunks = read_files.get_content()
    # print("Chunks: ", len(chunks))
    # print("Chunks[0]: ", chunks[0], "\n")
    # print("Chunks[1]: ", chunks[1], "\n")
    # print("Chunks[2]: ", chunks[2], "\n")
    # print("Chunks[3]: ", chunks[3], "\n")
    # print("Chunks[4]: ", chunks[4], "\n")
    # read_files.split_by_outline("/home/wwk/workspace/ai_project/BookMonster/data/upload/pdf_1754307801664.pdf", "output_chapters")

    p = "/home/wwk/workspace/ai_project/BookMonster/data/upload/pdf_1754307801664.pdf"
    # p = "/mnt/c/Users/wenka/Desktop/papers/china_trends.pdf"
    # 使用示例
    # extractor = PDFSectionExtractor(p)
    # sections = extractor.extract()

    # for i, sec in enumerate(sections, 1):
    #     print(f"### Section {i}: {sec['title']}")
    #     print(f"Content: {sec['content'][:200]}\n...\n{sec['content'][200:]}\n")

    # 实际使用
    output_directory = "/home/wwk/workspace/ai_project/BookMonster/tmp_data/"
    # process_pdf_file(p, output_directory,True)
    # process_pdf_with_images(p, output_dir=output_directory)
    # sections, images = process_pdf_with_images(p,output_directory)

    # 解析Markdown文件
    p= "/home/wwk/workspace/ai_project/BookMonster/agent/test.txt"
    md_parser = MultiFormatParser(p, output_directory)
    md_sections, md_images = md_parser.parse()
    for i, sec in enumerate(md_sections, 1):
        print(f"### Section {i}: {sec['title']}")
        print(f"Content: {sec['content'][:200]}\n...\n{sec['content'][200:]}\n")
    print(f"Total sections: {len(md_sections)}")