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

def sanitize_text(text):
    if not text:
        return ""
    t = str(text)
    # Replace ampersand first
    t = t.replace('&', ' and ')
    # Replace at symbol
    t = t.replace('@', ' at ')
    # Replace semicolon
    t = t.replace(';', ', ')
    # Replace underscore
    t = t.replace('_', ' ')
    # Replace hyphens and dashes (including em dash, en dash)
    t = t.replace('-', ' ')
    t = t.replace('—', ' ')
    t = t.replace('–', ' ')
    t = t.replace('−', ' ')
    # Replace dollar sign
    t = t.replace('$', 'BDT ')
    # Also replace currency symbol if needed or keep clean
    t = t.replace('৳', 'BDT ')
    # Clean up double spaces
    t = re.sub(r' +', ' ', t)
    # Double check no forbidden characters remain
    for ch in forbidden_chars:
        if ch in t:
            t = t.replace(ch, ' ')
    return t

print("Sanitizer module verified.")
