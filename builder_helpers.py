import os
import re
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

forbidden_chars = [';', '_', '-', '@', '&', '$']

def sanitize(text):
    if not text:
        return ""
    t = str(text)
    t = t.replace('&', ' and ')
    t = t.replace('@', ' at ')
    t = t.replace(';', ', ')
    t = t.replace('_', ' ')
    t = t.replace('-', ' ')
    t = t.replace('—', ' ')
    t = t.replace('–', ' ')
    t = t.replace('−', ' ')
    t = t.replace('$', 'BDT ')
    t = t.replace('৳', 'BDT ')
    t = re.sub(r' +', ' ', t)
    for ch in forbidden_chars:
        if ch in t:
            t = t.replace(ch, ' ')
    return t.strip()

def check_strict(text):
    for ch in forbidden_chars:
        if ch in text:
            raise ValueError(f"Forbidden character '{ch}' found in: {text[:50]}")

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=60, bottom=60, left=100, right=100):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def remove_table_borders(table):
    tblPr = table._tbl.tblPr
    borders = parse_xml(f'<w:tblBorders {nsdecls("w")}><w:top w:val="none"/><w:left w:val="none"/><w:bottom w:val="none"/><w:right w:val="none"/><w:insideH w:val="none"/><w:insideV w:val="none"/></w:tblBorders>')
    tblPr.append(borders)

def add_styled_heading(doc, text, level):
    clean_text = sanitize(text)
    check_strict(clean_text)
    h = doc.add_heading(clean_text, level=level)
    h.paragraph_format.keep_with_next = True
    if level == 1:
        h.paragraph_format.space_before = Pt(9)
        h.paragraph_format.space_after = Pt(2)
        for r in h.runs:
            r.font.name = 'Calibri'
            r.font.size = Pt(15)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0) # Pure Black
    elif level == 2:
        h.paragraph_format.space_before = Pt(6)
        h.paragraph_format.space_after = Pt(1.5)
        for r in h.runs:
            r.font.name = 'Calibri'
            r.font.size = Pt(12.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0) # Pure Black
    elif level == 3:
        h.paragraph_format.space_before = Pt(4)
        h.paragraph_format.space_after = Pt(1)
        for r in h.runs:
            r.font.name = 'Calibri'
            r.font.size = Pt(10.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0) # Pure Black
    return h

def add_body_p(doc, text, bold_prefix=None, space_after=2.0):
    clean_text = sanitize(text)
    check_strict(clean_text)
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.12
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    
    if bold_prefix:
        clean_prefix = sanitize(bold_prefix)
        check_strict(clean_prefix)
        r_pre = p.add_run(clean_prefix + " ")
        r_pre.font.name = 'Calibri'
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(0, 0, 0) # Pure Black
        
    r = p.add_run(clean_text)
    r.font.name = 'Calibri'
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(0, 0, 0) # Pure Black
    return p

def add_bullet_p(doc, bold_title, text):
    clean_title = sanitize(bold_title)
    clean_text = sanitize(text)
    check_strict(clean_title)
    check_strict(clean_text)
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(1.5)
    p.paragraph_format.line_spacing = 1.12
    p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    
    r_title = p.add_run(clean_title + " ")
    r_title.font.name = 'Calibri'
    r_title.font.size = Pt(10)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0, 0, 0) # Pure Black
    
    r_body = p.add_run(clean_text)
    r_body.font.name = 'Calibri'
    r_body.font.size = Pt(10)
    r_body.font.color.rgb = RGBColor(0, 0, 0) # Pure Black
    return p

def add_image_figure(doc, img_path, figure_label, caption_text, width_in=5.8):
    if not os.path.exists(img_path):
        print(f"Warning: Image path not found: {img_path}")
        return
    clean_label = sanitize(figure_label)
    clean_caption = sanitize(caption_text)
    check_strict(clean_label)
    check_strict(clean_caption)
    
    p_img = doc.add_paragraph()
    p_img.paragraph_format.space_before = Pt(2)
    p_img.paragraph_format.space_after = Pt(1)
    p_img.paragraph_format.keep_with_next = True
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.add_run().add_picture(img_path, width=Inches(width_in))
    
    p_cap = doc.add_paragraph()
    p_cap.paragraph_format.space_before = Pt(1)
    p_cap.paragraph_format.space_after = Pt(3)
    p_cap.paragraph_format.keep_with_next = False
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    r_lbl = p_cap.add_run(clean_label + ": ")
    r_lbl.font.name = 'Calibri'
    r_lbl.font.size = Pt(8.5)
    r_lbl.font.bold = True
    r_lbl.font.color.rgb = RGBColor(0, 0, 0) # Pure Black
    
    r_txt = p_cap.add_run(clean_caption)
    r_txt.font.name = 'Calibri'
    r_txt.font.size = Pt(8.5)
    r_txt.font.italic = True
    r_txt.font.color.rgb = RGBColor(0, 0, 0) # Pure Black

def add_side_by_side_figures(doc, img1, lbl1, cap1, w1, img2, lbl2, cap2, w2):
    if not os.path.exists(img1) or not os.path.exists(img2):
        print("Warning: One of side by side images missing")
        return
    c_lbl1 = sanitize(lbl1)
    c_cap1 = sanitize(cap1)
    c_lbl2 = sanitize(lbl2)
    c_cap2 = sanitize(cap2)
    check_strict(c_lbl1)
    check_strict(c_cap1)
    check_strict(c_lbl2)
    check_strict(c_cap2)
    
    tbl = doc.add_table(rows=1, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    remove_table_borders(tbl)
    
    # Cell 1
    c1 = tbl.rows[0].cells[0]
    c1.width = Inches(3.55)
    p1 = c1.paragraphs[0]
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.paragraph_format.space_before = Pt(1)
    p1.paragraph_format.space_after = Pt(1)
    p1.paragraph_format.keep_with_next = True
    p1.add_run().add_picture(img1, width=Inches(w1))
    
    p1_cap = c1.add_paragraph()
    p1_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1_cap.paragraph_format.space_before = Pt(1)
    p1_cap.paragraph_format.space_after = Pt(2)
    r1_l = p1_cap.add_run(c_lbl1 + ": ")
    r1_l.font.name = 'Calibri'
    r1_l.font.size = Pt(8)
    r1_l.font.bold = True
    r1_l.font.color.rgb = RGBColor(0, 0, 0)
    r1_t = p1_cap.add_run(c_cap1)
    r1_t.font.name = 'Calibri'
    r1_t.font.size = Pt(8)
    r1_t.font.italic = True
    r1_t.font.color.rgb = RGBColor(0, 0, 0)
    
    # Cell 2
    c2 = tbl.rows[0].cells[1]
    c2.width = Inches(3.55)
    p2 = c2.paragraphs[0]
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_before = Pt(1)
    p2.paragraph_format.space_after = Pt(1)
    p2.paragraph_format.keep_with_next = True
    p2.add_run().add_picture(img2, width=Inches(w2))
    
    p2_cap = c2.add_paragraph()
    p2_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2_cap.paragraph_format.space_before = Pt(1)
    p2_cap.paragraph_format.space_after = Pt(2)
    r2_l = p2_cap.add_run(c_lbl2 + ": ")
    r2_l.font.name = 'Calibri'
    r2_l.font.size = Pt(8)
    r2_l.font.bold = True
    r2_l.font.color.rgb = RGBColor(0, 0, 0)
    r2_t = p2_cap.add_run(c_cap2)
    r2_t.font.name = 'Calibri'
    r2_t.font.size = Pt(8)
    r2_t.font.italic = True
    r2_t.font.color.rgb = RGBColor(0, 0, 0)
    
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(2)

def add_styled_table(doc, headers, rows_data, col_widths=None):
    clean_headers = [sanitize(h) for h in headers]
    for h in clean_headers: check_strict(h)
    
    tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    
    # Header row with pure black background and crisp white text
    hdr_row = tbl.rows[0]
    for i, h in enumerate(clean_headers):
        cell = hdr_row.cells[i]
        set_cell_background(cell, "000000") # Pure Black Header
        set_cell_margins(cell, top=70, bottom=70, left=90, right=90)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(h)
        r.font.name = 'Calibri'
        r.font.size = Pt(9)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255) # Pure White
        
    # Data rows with black text and subtle alternating shading
    for r_idx, row in enumerate(rows_data):
        row_cells = tbl.rows[r_idx + 1]
        bg_col = "F5F5F5" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            clean_val = sanitize(val)
            check_strict(clean_val)
            cell = row_cells.cells[c_idx]
            set_cell_background(cell, bg_col)
            set_cell_margins(cell, top=50, bottom=50, left=90, right=90)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(0)
            r = p.add_run(clean_val)
            r.font.name = 'Calibri'
            r.font.size = Pt(8.5)
            r.font.color.rgb = RGBColor(0, 0, 0) # Pure Black
            
    if col_widths:
        for row in tbl.rows:
            for idx, w in enumerate(col_widths):
                row.cells[idx].width = Inches(w)
                
    p_sp = doc.add_paragraph()
    p_sp.paragraph_format.space_before = Pt(0)
    p_sp.paragraph_format.space_after = Pt(2.5)

print("Updated builder helpers for Black and White text and reduced gap spacing.")
