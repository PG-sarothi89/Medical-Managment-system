import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import os

# Set clean sans-serif font
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

# ==============================================================================
# 1. GENERATE DRAW.IO XML (curo_er_diagram.drawio)
# ==============================================================================
xml_lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<mxfile host="app.diagrams.net" modified="2026 11 18T20:00:00.000Z" agent="CURO Enterprise Modeler" version="24.0.0" type="device">',
    '  <diagram id="curo er diagram" name="CURO Medical DBMS ER Diagram">',
    '    <mxGraphModel dx="1800" dy="1200" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="2200" pageHeight="1600" background="#F8FAFC">',
    '      <root>',
    '        <mxCell id="0" />',
    '        <mxCell id="1" parent="0" />'
]

tables_data = [
    ('roles', 'ROLES (RBAC)', 40, 40, 240, 140, '#1E40AF', [('PK', 'id VARCHAR(32)'), ('', 'name VARCHAR(64)'), ('', 'description TEXT'), ('', 'createdAt TIMESTAMP')]),
    ('users', 'USERS (Staff)', 340, 40, 260, 240, '#1E40AF', [('PK', 'id VARCHAR(36)'), ('FK', 'roleId VARCHAR(32)'), ('', 'username VARCHAR(64)'), ('', 'email VARCHAR(128)'), ('', 'passwordHash VARCHAR(255)'), ('', 'name VARCHAR(128)'), ('', 'designation VARCHAR(128)'), ('', 'phone VARCHAR(32)'), ('', 'isActive BOOLEAN')]),
    ('categories', 'CATEGORIES', 660, 40, 240, 140, '#065F46', [('PK', 'id VARCHAR(36)'), ('FK', 'parentId VARCHAR(36)'), ('', 'name VARCHAR(128)'), ('', 'description TEXT')]),
    ('manufacturers', 'MANUFACTURERS', 960, 40, 240, 140, '#065F46', [('PK', 'id VARCHAR(36)'), ('', 'name VARCHAR(150)'), ('', 'contactInfo TEXT'), ('', 'createdAt TIMESTAMP')]),
    ('suppliers', 'SUPPLIERS', 1260, 40, 260, 220, '#9A3412', [('PK', 'id VARCHAR(36)'), ('', 'name VARCHAR(150)'), ('', 'contactPerson VARCHAR(100)'), ('', 'phone VARCHAR(32)'), ('', 'email VARCHAR(128)'), ('', 'address TEXT'), ('', 'taxNumber VARCHAR(64)'), ('', 'creditPeriodDays INT'), ('', 'outstandingBalance DEC')]),
    ('medicines', 'MEDICINES (Drug Master)', 660, 240, 280, 320, '#065F46', [('PK', 'id VARCHAR(36)'), ('FK', 'categoryId VARCHAR(36)'), ('FK', 'manufacturerId VARCHAR(36)'), ('', 'name VARCHAR(150)'), ('', 'genericName VARCHAR(150)'), ('', 'composition VARCHAR(255)'), ('', 'dosageForm VARCHAR(50)'), ('', 'strength VARCHAR(50)'), ('', 'barcode VARCHAR(64)'), ('', 'hsnCode VARCHAR(32)'), ('', 'requiresPrescription BOOL'), ('', 'reorderLevel INT'), ('', 'reorderQuantity INT')]),
    ('batches', 'BATCHES (FEFO Tracking)', 1000, 240, 260, 280, '#6B21A8', [('PK', 'id VARCHAR(36)'), ('FK', 'medicineId VARCHAR(36)'), ('FK', 'supplierId VARCHAR(36)'), ('', 'batchNumber VARCHAR(64)'), ('', 'manufactureDate DATE'), ('', 'expiryDate DATE'), ('', 'costPrice DECIMAL'), ('', 'sellingPrice DECIMAL'), ('', 'mrp DECIMAL'), ('', 'quantityReceived INT'), ('', 'quantityAvailable INT')]),
    ('inventoryMovements', 'INVENTORY MOVEMENTS', 1000, 580, 280, 260, '#6B21A8', [('PK', 'id VARCHAR(36)'), ('FK', 'medicineId VARCHAR(36)'), ('FK', 'batchId VARCHAR(36)'), ('FK', 'userId VARCHAR(36)'), ('', 'movementType VARCHAR(32)'), ('', 'quantity INT'), ('', 'balanceAfter INT'), ('', 'referenceType VARCHAR(32)'), ('', 'referenceId VARCHAR(64)'), ('', 'notes VARCHAR(255)')]),
    ('customers', 'CUSTOMERS (Patients)', 40, 340, 260, 260, '#0E7490', [('PK', 'id VARCHAR(36)'), ('', 'name VARCHAR(128)'), ('', 'phone VARCHAR(32)'), ('', 'email VARCHAR(128)'), ('', 'address TEXT'), ('', 'dateOfBirth DATE'), ('', 'creditLimit DECIMAL'), ('', 'outstandingBalance DEC'), ('', 'loyaltyPoints INT')]),
    ('doctors', 'DOCTORS (Physicians)', 340, 340, 260, 220, '#0E7490', [('PK', 'id VARCHAR(36)'), ('', 'name VARCHAR(128)'), ('', 'specialization VARCHAR(100)'), ('', 'licenseNumber VARCHAR(64)'), ('', 'hospitalChamber VARCHAR(150)'), ('', 'phone VARCHAR(32)'), ('', 'email VARCHAR(128)'), ('', 'isActive BOOLEAN')]),
    ('prescriptions', 'PRESCRIPTIONS', 180, 640, 260, 220, '#0E7490', [('PK', 'id VARCHAR(36)'), ('FK', 'customerId VARCHAR(36)'), ('FK', 'doctorId VARCHAR(36)'), ('', 'prescriptionNumber VARCHAR(64)'), ('', 'prescriptionDate DATE'), ('', 'notes TEXT'), ('', 'status VARCHAR(32)')]),
    ('prescriptionItems', 'PRESCRIPTION ITEMS', 480, 640, 260, 180, '#0E7490', [('PK', 'id VARCHAR(36)'), ('FK', 'prescriptionId VARCHAR(36)'), ('FK', 'medicineId VARCHAR(36)'), ('', 'dosage VARCHAR(64)'), ('', 'durationDays INT'), ('', 'quantityPrescribed INT')]),
    ('purchaseOrders', 'PURCHASE ORDERS', 1320, 320, 260, 220, '#9A3412', [('PK', 'id VARCHAR(36)'), ('FK', 'supplierId VARCHAR(36)'), ('FK', 'createdBy VARCHAR(36)'), ('', 'poNumber VARCHAR(64)'), ('', 'orderDate DATE'), ('', 'expectedDate DATE'), ('', 'totalAmount DECIMAL'), ('', 'status VARCHAR(32)')]),
    ('purchaseOrderItems', 'PURCHASE ORDER ITEMS', 1640, 320, 260, 180, '#9A3412', [('PK', 'id VARCHAR(36)'), ('FK', 'poId VARCHAR(36)'), ('FK', 'medicineId VARCHAR(36)'), ('', 'orderedQty INT'), ('', 'receivedQty INT'), ('', 'unitPrice DECIMAL'), ('', 'subtotal DECIMAL')]),
    ('purchases', 'PURCHASES', 1320, 600, 260, 220, '#9A3412', [('PK', 'id VARCHAR(36)'), ('FK', 'poId VARCHAR(36)'), ('FK', 'supplierId VARCHAR(36)'), ('FK', 'createdBy VARCHAR(36)'), ('', 'invoiceNumber VARCHAR(64)'), ('', 'purchaseDate DATE'), ('', 'totalAmount DECIMAL'), ('', 'paymentStatus VARCHAR(32)')]),
    ('sales', 'SALES (Invoices)', 180, 920, 280, 280, '#047857', [('PK', 'id VARCHAR(36)'), ('FK', 'customerId VARCHAR(36)'), ('FK', 'prescriptionId VARCHAR(36)'), ('FK', 'servedBy VARCHAR(36)'), ('', 'invoiceNumber VARCHAR(64)'), ('', 'subtotal DECIMAL'), ('', 'discountAmount DECIMAL'), ('', 'taxAmount DECIMAL'), ('', 'totalAmount DECIMAL'), ('', 'paymentMode VARCHAR(32)'), ('', 'paymentStatus VARCHAR(32)')]),
    ('saleItems', 'SALE ITEMS', 520, 920, 260, 200, '#047857', [('PK', 'id VARCHAR(36)'), ('FK', 'saleId VARCHAR(36)'), ('FK', 'medicineId VARCHAR(36)'), ('FK', 'batchId VARCHAR(36)'), ('', 'quantity INT'), ('', 'unitPrice DECIMAL'), ('', 'subtotal DECIMAL')]),
    ('payments', 'PAYMENTS', 180, 1260, 260, 200, '#047857', [('PK', 'id VARCHAR(36)'), ('FK', 'saleId VARCHAR(36)'), ('FK', 'customerId VARCHAR(36)'), ('FK', 'receivedBy VARCHAR(36)'), ('', 'amount DECIMAL'), ('', 'method VARCHAR(32)'), ('', 'transactionRef VARCHAR(128)')]),
    ('returns', 'RETURNS', 520, 1180, 260, 220, '#047857', [('PK', 'id VARCHAR(36)'), ('FK', 'saleId VARCHAR(36)'), ('FK', 'medicineId VARCHAR(36)'), ('FK', 'batchId VARCHAR(36)'), ('FK', 'processedBy VARCHAR(36)'), ('', 'quantity INT'), ('', 'refundAmount DECIMAL'), ('', 'reason VARCHAR(255)')]),
    ('auditLogs', 'AUDIT LOGS', 840, 920, 260, 200, '#475569', [('PK', 'id VARCHAR(36)'), ('FK', 'userId VARCHAR(36)'), ('', 'userName VARCHAR(128)'), ('', 'action VARCHAR(64)'), ('', 'tableName VARCHAR(64)'), ('', 'recordId VARCHAR(64)'), ('', 'details TEXT'), ('', 'createdAt TIMESTAMP')])
]

cell_id = 2
for tid, tname, x, y, w, h, col, fields in tables_data:
    xml_lines.append(f'        <mxCell id="{cell_id}" value="{tname}" style="swimlane;fontStyle=1;align=center;verticalAlign=top;childLayout=stackLayout;horizontal=1;startSize=28;horizontalStack=0;resizeParent=1;resizeParentMax=0;resizeLast=0;collapsible=1;marginBottom=0;fillColor={col};strokeColor={col};fontColor=#FFFFFF;fontFamily=Helvetica;fontSize=12;rounded=1;" vertex="1" parent="1">')
    xml_lines.append(f'          <mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry" />')
    xml_lines.append('        </mxCell>')
    p_id = cell_id
    cell_id += 1
    row_y = 28
    for key_type, fld in fields:
        prefix = f'{key_type} ' if key_type else '    '
        xml_lines.append(f'        <mxCell id="{cell_id}" value="{prefix}{fld}" style="text;strokeColor=none;fillColor=none;align=left;verticalAlign=middle;spacingLeft=8;spacingRight=4;overflow=hidden;rotatable=0;fontFamily=Courier New;fontSize=11;" vertex="1" parent="{p_id}">')
        xml_lines.append(f'          <mxGeometry y="{row_y}" width="{w}" height="20" as="geometry" />')
        xml_lines.append('        </mxCell>')
        cell_id += 1
        row_y += 20

xml_lines.extend([
    '      </root>',
    '    </mxGraphModel>',
    '  </diagram>',
    '</mxfile>'
])

with open('curo_er_diagram.drawio', 'w', encoding='utf-8') as f:
    f.write('\n'.join(xml_lines))
print('curo_er_diagram.drawio generated successfully')

# ==============================================================================
# 2. GENERATE HIGH RESOLUTION ER DIAGRAM (curo_er_diagram.png)
# ==============================================================================
fig, ax = plt.subplots(figsize=(26, 20), dpi=220)
ax.set_facecolor('#F8FAFC')
fig.patch.set_facecolor('#F8FAFC')
ax.set_xlim(0, 260)
ax.set_ylim(0, 200)
ax.axis('off')

# Title Banner
title_box = patches.FancyBboxPatch((10, 186), 240, 11, boxstyle="round,pad=0.5", facecolor='#0F172A', edgecolor='#1E293B', linewidth=1.5)
ax.add_patch(title_box)
ax.text(130, 192.5, 'CURO MEDICAL MANAGEMENT SYSTEM', fontsize=18, fontweight='bold', ha='center', va='center', color='#FFFFFF')
ax.text(130, 188.5, 'Enterprise Relational Database Schema and Complete Entity Relationship Diagram (Draw.io Style)', fontsize=11, ha='center', va='center', color='#94A3B8')

# Domain color palette
colors = {
    'security': ('#1E40AF', '#EFF6FF', '#BFDBFE'),
    'catalog':  ('#065F46', '#ECFDF5', '#A7F3D0'),
    'inventory':('#6B21A8', '#FAF5FF', '#E9D5FF'),
    'clinical': ('#0E7490', '#ECFEFF', '#A5F3FC'),
    'procure':  ('#9A3412', '#FFF7ED', '#FED7AA'),
    'sales':    ('#047857', '#F0FDF4', '#BBF7D0'),
    'audit':    ('#334155', '#F8FAFC', '#CBD5E1')
}

# Coordinate definitions for clean layout
layout = [
    # Row 1: Security & Master Catalog
    ('roles', 'ROLES', 'security', 10, 142, 34, 38, [('PK', 'id VARCHAR(32)'), ('', 'name VARCHAR(64)'), ('', 'description TEXT'), ('', 'createdAt TIMESTAMP')]),
    ('users', 'USERS (Staff)', 'security', 50, 134, 38, 46, [('PK', 'id VARCHAR(36)'), ('FK', 'roleId VARCHAR(32)'), ('', 'username VARCHAR(64)'), ('', 'email VARCHAR(128)'), ('', 'passwordHash VARCHAR(255)'), ('', 'name VARCHAR(128)'), ('', 'designation VARCHAR(128)'), ('', 'phone VARCHAR(32)'), ('', 'isActive BOOLEAN'), ('', 'createdAt TIMESTAMP')]),
    ('categories', 'CATEGORIES', 'catalog', 94, 142, 36, 38, [('PK', 'id VARCHAR(36)'), ('FK', 'parentId VARCHAR(36)'), ('', 'name VARCHAR(128)'), ('', 'description TEXT')]),
    ('manufacturers', 'MANUFACTURERS', 'catalog', 136, 142, 38, 38, [('PK', 'id VARCHAR(36)'), ('', 'name VARCHAR(150)'), ('', 'contactInfo TEXT'), ('', 'createdAt TIMESTAMP')]),
    ('suppliers', 'SUPPLIERS', 'procure', 180, 134, 42, 46, [('PK', 'id VARCHAR(36)'), ('', 'name VARCHAR(150)'), ('', 'contactPerson VARCHAR(100)'), ('', 'phone VARCHAR(32)'), ('', 'email VARCHAR(128)'), ('', 'address TEXT'), ('', 'taxNumber VARCHAR(64)'), ('', 'creditPeriodDays INT'), ('', 'outstandingBalance DEC'), ('', 'createdAt TIMESTAMP')]),

    # Row 2: Medicines & Batches & Purchase Orders
    ('customers', 'CUSTOMERS (Patients)', 'clinical', 10, 78, 36, 48, [('PK', 'id VARCHAR(36)'), ('', 'name VARCHAR(128)'), ('', 'phone VARCHAR(32)'), ('', 'email VARCHAR(128)'), ('', 'address TEXT'), ('', 'dateOfBirth DATE'), ('', 'creditLimit DECIMAL'), ('', 'outstandingBalance DEC'), ('', 'loyaltyPoints INT'), ('', 'createdAt TIMESTAMP')]),
    ('doctors', 'DOCTORS (Physicians)', 'clinical', 52, 78, 36, 46, [('PK', 'id VARCHAR(36)'), ('', 'name VARCHAR(128)'), ('', 'specialization VARCHAR(100)'), ('', 'licenseNumber VARCHAR(64)'), ('', 'hospitalChamber VARCHAR(150)'), ('', 'phone VARCHAR(32)'), ('', 'email VARCHAR(128)'), ('', 'isActive BOOLEAN'), ('', 'createdAt TIMESTAMP')]),
    ('medicines', 'MEDICINES (Drug Master)', 'catalog', 94, 72, 40, 56, [('PK', 'id VARCHAR(36)'), ('FK', 'categoryId VARCHAR(36)'), ('FK', 'manufacturerId VARCHAR(36)'), ('', 'name VARCHAR(150)'), ('', 'genericName VARCHAR(150)'), ('', 'composition VARCHAR(255)'), ('', 'dosageForm VARCHAR(50)'), ('', 'strength VARCHAR(50)'), ('', 'barcode VARCHAR(64)'), ('', 'hsnCode VARCHAR(32)'), ('', 'requiresPrescription BOOL'), ('', 'reorderLevel INT'), ('', 'reorderQuantity INT'), ('', 'rackLocation VARCHAR(64)')]),
    ('batches', 'BATCHES (FEFO Tracking)', 'inventory', 140, 74, 40, 54, [('PK', 'id VARCHAR(36)'), ('FK', 'medicineId VARCHAR(36)'), ('FK', 'supplierId VARCHAR(36)'), ('', 'batchNumber VARCHAR(64)'), ('', 'manufactureDate DATE'), ('', 'expiryDate DATE'), ('', 'costPrice DECIMAL'), ('', 'sellingPrice DECIMAL'), ('', 'mrp DECIMAL'), ('', 'quantityReceived INT'), ('', 'quantityAvailable INT'), ('', 'rackLocation VARCHAR(64)')]),
    ('purchaseOrders', 'PURCHASE ORDERS', 'procure', 186, 82, 38, 44, [('PK', 'id VARCHAR(36)'), ('FK', 'supplierId VARCHAR(36)'), ('FK', 'createdBy VARCHAR(36)'), ('', 'poNumber VARCHAR(64)'), ('', 'orderDate DATE'), ('', 'expectedDate DATE'), ('', 'totalAmount DECIMAL'), ('', 'status VARCHAR(32)'), ('', 'createdAt TIMESTAMP')]),
    ('purchaseOrderItems', 'PO ITEMS', 'procure', 228, 86, 26, 38, [('PK', 'id VARCHAR(36)'), ('FK', 'poId VARCHAR(36)'), ('FK', 'medicineId VARCHAR(36)'), ('', 'orderedQty INT'), ('', 'receivedQty INT'), ('', 'unitPrice DECIMAL'), ('', 'subtotal DECIMAL')]),

    # Row 3: Prescriptions, Sales, Movements, Audit
    ('prescriptions', 'PRESCRIPTIONS', 'clinical', 10, 16, 36, 48, [('PK', 'id VARCHAR(36)'), ('FK', 'customerId VARCHAR(36)'), ('FK', 'doctorId VARCHAR(36)'), ('', 'prescriptionNumber VARCHAR(64)'), ('', 'prescriptionDate DATE'), ('', 'notes TEXT'), ('', 'status VARCHAR(32)'), ('', 'createdAt TIMESTAMP')]),
    ('prescriptionItems', 'PRESCRIPTION ITEMS', 'clinical', 52, 24, 36, 40, [('PK', 'id VARCHAR(36)'), ('FK', 'prescriptionId VARCHAR(36)'), ('FK', 'medicineId VARCHAR(36)'), ('', 'dosage VARCHAR(64)'), ('', 'durationDays INT'), ('', 'quantityPrescribed INT')]),
    ('sales', 'SALES (POS Invoices)', 'sales', 94, 10, 40, 54, [('PK', 'id VARCHAR(36)'), ('FK', 'customerId VARCHAR(36)'), ('FK', 'prescriptionId VARCHAR(36)'), ('FK', 'servedBy VARCHAR(36)'), ('', 'invoiceNumber VARCHAR(64)'), ('', 'subtotal DECIMAL'), ('', 'discountAmount DECIMAL'), ('', 'taxAmount DECIMAL'), ('', 'totalAmount DECIMAL'), ('', 'paymentMode VARCHAR(32)'), ('', 'paymentStatus VARCHAR(32)'), ('', 'saleDate TIMESTAMP')]),
    ('saleItems', 'SALE ITEMS', 'sales', 140, 20, 36, 42, [('PK', 'id VARCHAR(36)'), ('FK', 'saleId VARCHAR(36)'), ('FK', 'medicineId VARCHAR(36)'), ('FK', 'batchId VARCHAR(36)'), ('', 'quantity INT'), ('', 'unitPrice DECIMAL'), ('', 'subtotal DECIMAL')]),
    ('payments', 'PAYMENTS', 'sales', 182, 24, 34, 40, [('PK', 'id VARCHAR(36)'), ('FK', 'saleId VARCHAR(36)'), ('FK', 'customerId VARCHAR(36)'), ('FK', 'receivedBy VARCHAR(36)'), ('', 'amount DECIMAL'), ('', 'method VARCHAR(32)'), ('', 'transactionRef VARCHAR(128)')]),
    ('returns', 'RETURNS', 'sales', 220, 22, 34, 42, [('PK', 'id VARCHAR(36)'), ('FK', 'saleId VARCHAR(36)'), ('FK', 'medicineId VARCHAR(36)'), ('FK', 'batchId VARCHAR(36)'), ('FK', 'processedBy VARCHAR(36)'), ('', 'quantity INT'), ('', 'refundAmount DECIMAL'), ('', 'reason VARCHAR(255)')]),
    ('inventoryMovements', 'INVENTORY MOVEMENTS', 'inventory', 186, 12, 40, 48, [('PK', 'id VARCHAR(36)'), ('FK', 'medicineId VARCHAR(36)'), ('FK', 'batchId VARCHAR(36)'), ('FK', 'userId VARCHAR(36)'), ('', 'movementType VARCHAR(32)'), ('', 'quantity INT'), ('', 'balanceAfter INT'), ('', 'referenceType VARCHAR(32)'), ('', 'referenceId VARCHAR(64)'), ('', 'notes VARCHAR(255)')]),
    ('auditLogs', 'AUDIT LOGS (Ledger)', 'audit', 230, 134, 26, 46, [('PK', 'id VARCHAR(36)'), ('FK', 'userId VARCHAR(36)'), ('', 'userName VARCHAR(128)'), ('', 'action VARCHAR(64)'), ('', 'tableName VARCHAR(64)'), ('', 'recordId VARCHAR(64)'), ('', 'details TEXT'), ('', 'createdAt TIMESTAMP')])
]

# Render each table
centers = {}
for code, name, group, x, y, w, h, fields in layout:
    hdr_col, bg_col, bdr_col = colors[group]
    centers[code] = (x + w/2, y + h/2)
    
    # Outer box
    rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.2", facecolor=bg_col, edgecolor=hdr_col, linewidth=1.5)
    ax.add_patch(rect)
    
    # Header box
    hdr = patches.Rectangle((x, y + h - 6), w, 6, facecolor=hdr_col, edgecolor=hdr_col)
    ax.add_patch(hdr)
    ax.text(x + w/2, y + h - 3, name, fontsize=8.5, fontweight='bold', ha='center', va='center', color='#FFFFFF')
    
    # Fields
    curr_y = y + h - 9.5
    for ktype, fname in fields:
        if ktype == 'PK':
            badge_color = '#B91C1C'
            badge_bg = '#FEE2E2'
        elif ktype == 'FK':
            badge_color = '#1D4ED8'
            badge_bg = '#DBEAFE'
        else:
            badge_color = '#64748B'
            badge_bg = '#F1F5F9'
            
        # Key badge
        if ktype:
            badge = patches.FancyBboxPatch((x + 1.2, curr_y - 1.2), 3.8, 2.5, boxstyle="round,pad=0.1", facecolor=badge_bg, edgecolor=badge_color, linewidth=0.6)
            ax.add_patch(badge)
            ax.text(x + 3.1, curr_y, ktype, fontsize=5.5, fontweight='bold', ha='center', va='center', color=badge_color)
            
        # Field text
        ax.text(x + 5.8, curr_y, fname, fontsize=6.2, ha='left', va='center', color='#0F172A', fontfamily='monospace')
        curr_y -= 3.1

# Draw representative relationship connector lines (cardinality 1 to N)
def connect_entities(src, dst, style='arc3,rad=0.1', color='#475569'):
    x1, y1 = centers[src]
    x2, y2 = centers[dst]
    arrow = patches.ConnectionStyle(style)
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color=color, lw=1.2, connectionstyle=style))

connect_entities('roles', 'users', 'arc3,rad=-0.1', '#1E40AF')
connect_entities('categories', 'medicines', 'arc3,rad=0.08', '#065F46')
connect_entities('manufacturers', 'medicines', 'arc3,rad=-0.08', '#065F46')
connect_entities('medicines', 'batches', 'arc3,rad=0.05', '#6B21A8')
connect_entities('suppliers', 'batches', 'arc3,rad=0.12', '#9A3412')
connect_entities('suppliers', 'purchaseOrders', 'arc3,rad=-0.08', '#9A3412')
connect_entities('purchaseOrders', 'purchaseOrderItems', 'arc3,rad=0.05', '#9A3412')
connect_entities('medicines', 'purchaseOrderItems', 'arc3,rad=-0.15', '#9A3412')
connect_entities('customers', 'prescriptions', 'arc3,rad=-0.06', '#0E7490')
connect_entities('doctors', 'prescriptions', 'arc3,rad=0.06', '#0E7490')
connect_entities('prescriptions', 'prescriptionItems', 'arc3,rad=0.05', '#0E7490')
connect_entities('medicines', 'prescriptionItems', 'arc3,rad=0.12', '#0E7490')
connect_entities('customers', 'sales', 'arc3,rad=0.15', '#047857')
connect_entities('prescriptions', 'sales', 'arc3,rad=-0.08', '#047857')
connect_entities('sales', 'saleItems', 'arc3,rad=0.05', '#047857')
connect_entities('batches', 'saleItems', 'arc3,rad=-0.12', '#047857')
connect_entities('sales', 'payments', 'arc3,rad=0.08', '#047857')
connect_entities('sales', 'returns', 'arc3,rad=-0.1', '#047857')
connect_entities('batches', 'inventoryMovements', 'arc3,rad=-0.12', '#6B21A8')
connect_entities('users', 'auditLogs', 'arc3,rad=-0.18', '#334155')

plt.tight_layout()
plt.savefig('curo_er_diagram.png', dpi=220, bbox_inches='tight')
plt.close()
print('curo_er_diagram.png generated successfully')

# ==============================================================================
# 3. GENERATE USE CASE DIAGRAM (curo_use_case_diagram.png)
# ==============================================================================
fig, ax = plt.subplots(figsize=(18, 12), dpi=200)
ax.set_facecolor('#F8FAFC')
fig.patch.set_facecolor('#F8FAFC')
ax.set_xlim(0, 180)
ax.set_ylim(0, 120)
ax.axis('off')

# Title
ax.text(90, 114, 'CURO MEDICAL MANAGEMENT SYSTEM', fontsize=16, fontweight='bold', ha='center', color='#0F172A')
ax.text(90, 110, 'Comprehensive System Use Case Diagram Across Organizational Roles', fontsize=10, ha='center', color='#64748B')

# System Boundary
sys_box = patches.FancyBboxPatch((38, 8), 104, 98, boxstyle="round,pad=0.5", facecolor='#FFFFFF', edgecolor='#0284C7', linewidth=2, linestyle='--')
ax.add_patch(sys_box)
ax.text(90, 102, 'System Boundary: CURO Enterprise Platform', fontsize=11, fontweight='bold', ha='center', color='#0369A1')

# Left Actors
actors_left = [
    ('Administrator', 18, 90, '#1E40AF'),
    ('Pharmacist', 18, 62, '#065F46'),
    ('Cashier', 18, 30, '#047857')
]

# Right Actors
actors_right = [
    ('Doctor / Physician', 162, 90, '#0E7490'),
    ('Inventory Manager', 162, 60, '#9A3412'),
    ('Patient Customer', 162, 28, '#475569')
]

def draw_actor(name, x, y, col):
    # Head
    head = plt.Circle((x, y + 4), 2.2, facecolor='#E2E8F0', edgecolor=col, linewidth=1.8)
    ax.add_patch(head)
    # Body
    ax.plot([x, x], [y + 1.8, y - 2.5], color=col, lw=2)
    # Arms
    ax.plot([x - 3, x + 3], [y + 0.5, y + 0.5], color=col, lw=2)
    # Legs
    ax.plot([x, x - 2.5], [y - 2.5, y - 6.5], color=col, lw=2)
    ax.plot([x, x + 2.5], [y - 2.5, y - 6.5], color=col, lw=2)
    # Label
    ax.text(x, y - 9.5, name, fontsize=8.5, fontweight='bold', ha='center', va='center', color=col)

for name, x, y, col in actors_left + actors_right:
    draw_actor(name, x, y, col)

# Use Cases (Ovals in middle)
use_cases = [
    ('Authenticate and Manage Staff RBAC', 90, 94, '#EFF6FF', '#1E40AF'),
    ('Maintain Pharmaceutical Master Catalog', 90, 84, '#ECFDF5', '#065F46'),
    ('Receive Batches and Enforce FEFO Queue', 90, 74, '#FAF5FF', '#6B21A8'),
    ('Perform Stock Adjustments and Write Offs', 90, 64, '#FAF5FF', '#6B21A8'),
    ('Create and Sign Digital Prescriptions', 90, 54, '#ECFEFF', '#0E7490'),
    ('Scan Barcodes and Dispense at POS', 90, 44, '#F0FDF4', '#047857'),
    ('Track Patient Credit and Settle Balances', 90, 34, '#ECFEFF', '#0E7490'),
    ('Issue GST Invoices and Audit Returns', 90, 24, '#F0FDF4', '#047857'),
    ('Monitor Real Time Alerts and BI Analytics', 90, 14, '#FFF7ED', '#9A3412')
]

uc_coords = {}
for text, x, y, bg, border in use_cases:
    uc_coords[text] = (x, y)
    ellipse = patches.Ellipse((x, y), 58, 6.8, facecolor=bg, edgecolor=border, linewidth=1.4)
    ax.add_patch(ellipse)
    ax.text(x, y, text, fontsize=8, fontweight='bold', ha='center', va='center', color='#0F172A')

# Connections from Actors to Use Cases
def link_actor(ax_coord, uc_text, col):
    x1, y1 = ax_coord
    x2, y2 = uc_coords[uc_text]
    ax.plot([x1, x2 - 28 if x1 < x2 else x2 + 28], [y1, y2], color=col, lw=1.1, alpha=0.85)

# Admin
link_actor((18, 90), 'Authenticate and Manage Staff RBAC', '#1E40AF')
link_actor((18, 90), 'Maintain Pharmaceutical Master Catalog', '#1E40AF')
link_actor((18, 90), 'Monitor Real Time Alerts and BI Analytics', '#1E40AF')

# Pharmacist
link_actor((18, 62), 'Maintain Pharmaceutical Master Catalog', '#065F46')
link_actor((18, 62), 'Receive Batches and Enforce FEFO Queue', '#065F46')
link_actor((18, 62), 'Scan Barcodes and Dispense at POS', '#065F46')

# Cashier
link_actor((18, 30), 'Scan Barcodes and Dispense at POS', '#047857')
link_actor((18, 30), 'Issue GST Invoices and Audit Returns', '#047857')
link_actor((18, 30), 'Track Patient Credit and Settle Balances', '#047857')

# Doctor
link_actor((162, 90), 'Create and Sign Digital Prescriptions', '#0E7490')

# Inventory Manager
link_actor((162, 60), 'Receive Batches and Enforce FEFO Queue', '#9A3412')
link_actor((162, 60), 'Perform Stock Adjustments and Write Offs', '#9A3412')
link_actor((162, 60), 'Monitor Real Time Alerts and BI Analytics', '#9A3412')

# Patient Customer
link_actor((162, 28), 'Scan Barcodes and Dispense at POS', '#475569')
link_actor((162, 28), 'Track Patient Credit and Settle Balances', '#475569')
link_actor((162, 28), 'Issue GST Invoices and Audit Returns', '#475569')

plt.tight_layout()
plt.savefig('curo_use_case_diagram.png', dpi=200, bbox_inches='tight')
plt.close()
print('curo_use_case_diagram.png generated successfully')

# ==============================================================================
# 4. GENERATE DATA FLOW DIAGRAM (curo_data_flow_diagram.png)
# ==============================================================================
fig, ax = plt.subplots(figsize=(18, 12), dpi=200)
ax.set_facecolor('#F8FAFC')
fig.patch.set_facecolor('#F8FAFC')
ax.set_xlim(0, 180)
ax.set_ylim(0, 120)
ax.axis('off')

# Title
ax.text(90, 114, 'CURO MEDICAL MANAGEMENT SYSTEM', fontsize=16, fontweight='bold', ha='center', color='#0F172A')
ax.text(90, 110, 'Level 1 Functional Data Flow Diagram (Processes, Data Stores, and Flows)', fontsize=10, ha='center', color='#64748B')

# External Entities (Square Boxes with double borders or shadows)
entities_dfd = [
    ('Staff User / Admin', 16, 92, '#1E40AF'),
    ('Doctor / Clinic', 16, 52, '#0E7490'),
    ('Patient Customer', 16, 16, '#047857'),
    ('Drug Supplier', 164, 52, '#9A3412')
]

for name, x, y, col in entities_dfd:
    box = patches.FancyBboxPatch((x - 12, y - 6), 24, 12, boxstyle="square,pad=0.2", facecolor='#F1F5F9', edgecolor=col, linewidth=2)
    ax.add_patch(box)
    ax.text(x, y, name, fontsize=8, fontweight='bold', ha='center', va='center', color=col)

# Processes (Circles or Rounded Rectangles with Process Numbers)
processes = [
    ('1.0', 'Authentication and\nRBAC Verification', 56, 92, '#DBEAFE', '#1E40AF'),
    ('2.0', 'Prescription Intake\nand Order Validation', 56, 52, '#CFFAFE', '#0E7490'),
    ('3.0', 'Optical POS Dispensing\nand GST Calculation', 56, 16, '#DCFCE7', '#047857'),
    ('4.0', 'FEFO Inventory\nAllocation Engine', 104, 52, '#F3E8FF', '#6B21A8'),
    ('5.0', 'Procurement and\nBatch Receiving', 136, 52, '#FFEDD5', '#9A3412'),
    ('6.0', 'BI Forecasting and\nAudit Logging', 104, 92, '#F1F5F9', '#334155')
]

for num, name, x, y, bg, border in processes:
    circ = patches.FancyBboxPatch((x - 14, y - 7), 28, 14, boxstyle="round,pad=0.3", facecolor=bg, edgecolor=border, linewidth=1.6)
    ax.add_patch(circ)
    ax.text(x, y + 3.2, num, fontsize=7.5, fontweight='bold', ha='center', color=border)
    ax.text(x, y - 1.5, name, fontsize=7.2, fontweight='bold', ha='center', va='center', color='#0F172A')

# Data Stores (Open ended rectangles)
stores = [
    ('D1', 'Users and Roles Ledger', 104, 16, '#1E40AF'),
    ('D2', 'Master Medicines and Batches', 104, 72, '#6B21A8'),
    ('D3', 'Digital Clinical Prescriptions', 56, 72, '#0E7490'),
    ('D4', 'Sales Invoices and Payments', 56, 34, '#047857'),
    ('D5', 'System Mutation Audit Trail', 148, 92, '#334155')
]

for did, dname, x, y, col in stores:
    # Open ended lines
    ax.plot([x - 14, x + 14], [y + 3.5, y + 3.5], color=col, lw=1.6)
    ax.plot([x - 14, x + 14], [y - 3.5, y - 3.5], color=col, lw=1.6)
    ax.plot([x - 14, x - 14], [y - 3.5, y + 3.5], color=col, lw=1.6)
    rect = patches.Rectangle((x - 14, y - 3.5), 28, 7, facecolor='#FFFFFF', edgecolor='none')
    ax.add_patch(rect)
    ax.text(x - 10, y, did, fontsize=7.5, fontweight='bold', ha='center', va='center', color=col)
    ax.text(x + 2, y, dname, fontsize=6.8, ha='center', va='center', color='#0F172A')

# Arrows connecting entities, processes, and stores
def draw_flow(p1, p2, label, offset_y=0):
    x1, y1 = p1
    x2, y2 = p2
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle="->", color='#334155', lw=1.2))
    mx = (x1 + x2) / 2
    my = (y1 + y2) / 2 + offset_y
    ax.text(mx, my, label, fontsize=6.2, ha='center', va='center', color='#475569', bbox=dict(boxstyle="square,pad=0.1", fc="#FFFFFF", ec="none"))

draw_flow((28, 92), (42, 92), 'Credentials', 2)
draw_flow((70, 92), (90, 92), 'Auth Token', 2)
draw_flow((28, 52), (42, 52), 'Rx Orders', 2)
draw_flow((56, 45), (56, 23), 'Approved Rx', 0)
draw_flow((28, 16), (42, 16), 'Cash / Credit', 2)
draw_flow((70, 16), (90, 52), 'Stock Deduct Request', -3)
draw_flow((152, 52), (150, 52), 'Shipments', 2)
draw_flow((122, 52), (118, 52), 'New Batches', 2)
draw_flow((104, 59), (104, 68), 'Stock Levels', 0)
draw_flow((104, 85), (104, 76), 'Analytics Query', 0)
draw_flow((118, 92), (134, 92), 'Audit Event', 2)

plt.tight_layout()
plt.savefig('curo_data_flow_diagram.png', dpi=200, bbox_inches='tight')
plt.close()
print('curo_data_flow_diagram.png generated successfully')

# ==============================================================================
# 5. GENERATE DATA SEQUENCE FLOW DIAGRAM (curo_sequence_diagram.png)
# ==============================================================================
fig, ax = plt.subplots(figsize=(20, 13), dpi=200)
ax.set_facecolor('#F8FAFC')
fig.patch.set_facecolor('#F8FAFC')
ax.set_xlim(0, 200)
ax.set_ylim(0, 130)
ax.axis('off')

# Title
ax.text(100, 124, 'CURO MEDICAL MANAGEMENT SYSTEM', fontsize=16, fontweight='bold', ha='center', color='#0F172A')
ax.text(100, 120, 'Data Sequence Flow Diagram: Optical POS Dispensing, FEFO Stock Deduction, and Transactional Settlement', fontsize=10, ha='center', color='#64748B')

lifelines = [
    ('Cashier / Staff', 20, '#1E40AF'),
    ('POS Client Terminal', 55, '#0E7490'),
    ('NodeJS API Controller', 95, '#065F46'),
    ('FEFO Allocation Engine', 135, '#6B21A8'),
    ('PostgreSQL Database', 175, '#047857')
]

# Draw Lifeline Headers and Dashed Lines
for name, x, col in lifelines:
    box = patches.FancyBboxPatch((x - 14, 108), 28, 8, boxstyle="round,pad=0.2", facecolor='#FFFFFF', edgecolor=col, linewidth=1.6)
    ax.add_patch(box)
    ax.text(x, 112, name, fontsize=8, fontweight='bold', ha='center', va='center', color=col)
    ax.plot([x, x], [108, 10], color='#CBD5E1', linestyle='--', lw=1.2)

# Sequence messages (y coordinates from top to bottom)
steps = [
    (100, 20, 55, '1. Scan EAN 13 Barcode via Optical Camera', '#1E40AF', False),
    (93, 55, 95, '2. GET api medicines barcode query', '#0E7490', False),
    (86, 95, 175, '3. Query active medicine and available batches', '#065F46', False),
    (79, 175, 95, '4. Return medicine metadata and batch inventory', '#047857', True),
    (72, 95, 55, '5. Display formulation and selling rate in POS cart', '#065F46', True),
    (65, 20, 55, '6. Confirm payment mode and press Proceed to Checkout', '#1E40AF', False),
    (58, 55, 95, '7. POST api checkout with atomic payload', '#0E7490', False),
    (51, 95, 175, '8. BEGIN ACID Transaction (Isolation Level Read Committed)', '#B91C1C', False),
    (44, 95, 135, '9. Request FEFO batch allocation for required quantity', '#6B21A8', False),
    (37, 135, 175, '10. Deduct quantity available from earliest expiry batch', '#6B21A8', False),
    (30, 95, 175, '11. Insert sales invoice, sale items, and inventory movement', '#047857', False),
    (23, 95, 175, '12. COMMIT ACID Transaction and generate system audit record', '#B91C1C', False),
    (16, 95, 55, '13. Return invoice reference and transaction confirmation', '#065F46', True),
    (10, 55, 20, '14. Render official thermal tax invoice receipt on screen', '#0E7490', True)
]

for y, x1, x2, msg, col, is_ret in steps:
    style = "--" if is_ret else "-"
    ax.annotate('', xy=(x2, y), xytext=(x1, y),
                arrowprops=dict(arrowstyle="->", color=col, lw=1.3, linestyle=style))
    mx = (x1 + x2) / 2
    # Place text label
    ax.text(mx, y + 1.8, msg, fontsize=7.2, fontweight='bold', ha='center', va='center', color=col,
            bbox=dict(boxstyle="square,pad=0.15", fc="#FFFFFF", ec="none", alpha=0.9))

plt.tight_layout()
plt.savefig('curo_sequence_diagram.png', dpi=200, bbox_inches='tight')
plt.close()
print('curo_sequence_diagram.png generated successfully')
