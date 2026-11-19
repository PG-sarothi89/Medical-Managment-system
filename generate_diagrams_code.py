import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# Set common font styling
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

# 1. GENERATE ER DIAGRAM (Draw.io styled, highly detailed)
fig, ax = plt.subplots(figsize=(24, 18), dpi=200)
ax.set_facecolor('#F8FAFC')
fig.patch.set_facecolor('#F8FAFC')
ax.set_xlim(0, 240)
ax.set_ylim(0, 180)
ax.axis('off')

# Title
ax.text(120, 174, 'CURO MEDICAL MANAGEMENT SYSTEM', fontsize=22, fontweight='bold', ha='center', color='#0F172A')
ax.text(120, 169, 'Enterprise Relational Database Schema and Entity Relationship Diagram', fontsize=13, ha='center', color='#475569')

entities = {
    # Security and RBAC
    'roles': {'x': 10, 'y': 135, 'w': 32, 'h': 24, 'color': '#1E40AF', 'light': '#EFF6FF',
              'pk': ['id VARCHAR(32)'], 'fk': [], 'attrs': ['name VARCHAR(64)', 'description TEXT', 'createdAt TIMESTAMP']},
    'users': {'x': 52, 'y': 130, 'w': 36, 'h': 34, 'color': '#1E40AF', 'light': '#EFF6FF',
              'pk': ['id VARCHAR(36)'], 'fk': ['roleId VARCHAR(32) FK'], 
              'attrs': ['username VARCHAR(64)', 'email VARCHAR(128)', 'passwordHash VARCHAR(255)', 'name VARCHAR(128)', 'designation VARCHAR(128)', 'phone VARCHAR(32)', 'isActive BOOLEAN', 'createdAt TIMESTAMP']},
    
    # Drug Master Catalog
    'categories': {'x': 100, 'y': 135, 'w': 32, 'h': 22, 'color': '#065F46', 'light': '#ECFDF5',
                   'pk': ['id VARCHAR(36)'], 'fk': ['parentId VARCHAR(36) FK'], 'attrs': ['name VARCHAR(128)', 'description TEXT']},
    'manufacturers': {'x': 142, 'y': 135, 'w': 34, 'h': 22, 'color': '#065F46', 'light': '#ECFDF5',
                      'pk': ['id VARCHAR(36)'], 'fk': [], 'attrs': ['name VARCHAR(150)', 'contactInfo TEXT', 'createdAt TIMESTAMP']},
    'medicines': {'x': 100, 'y': 80, 'w': 38, 'h': 42, 'color': '#065F46', 'light': '#ECFDF5',
                  'pk': ['id VARCHAR(36)'], 'fk': ['categoryId VARCHAR(36) FK', 'manufacturerId VARCHAR(36) FK'],
                  'attrs': ['name VARCHAR(150)', 'genericName VARCHAR(150)', 'composition VARCHAR(255)', 'dosageForm VARCHAR(50)', 'strength VARCHAR(50)', 'barcode VARCHAR(64)', 'hsnCode VARCHAR(32)', 'requiresPrescription BOOL', 'reorderLevel INT', 'reorderQuantity INT', 'rackLocation VARCHAR(64)', 'isActive BOOLEAN']},

    # Suppliers and Procurement
    'suppliers': {'x': 190, 'y': 125, 'w': 40, 'h': 38, 'color': '#9A3412', 'light': '#FFF7ED',
                  'pk': ['id VARCHAR(36)'], 'fk': [],
                  'attrs': ['name VARCHAR(150)', 'contactPerson VARCHAR(100)', 'phone VARCHAR(32)', 'email VARCHAR(128)', 'address TEXT', 'taxNumber VARCHAR(64)', 'creditPeriodDays INT', 'outstandingBalance DEC', 'createdAt TIMESTAMP']},
    'purchaseOrders': {'x': 190, 'y': 75, 'w': 40, 'h': 35, 'color': '#9A3412', 'light': '#FFF7ED',
                       'pk': ['id VARCHAR(36)'], 'fk': ['supplierId VARCHAR(36) FK', 'createdBy VARCHAR(36) FK'],
                       'attrs': ['poNumber VARCHAR(64)', 'orderDate DATE', 'expectedDate DATE', 'totalAmount DECIMAL', 'status VARCHAR(32)', 'createdAt TIMESTAMP']},
    'purchaseOrderItems': {'x': 190, 'y': 30, 'w': 40, 'h': 32, 'color': '#9A3412', 'light': '#FFF7ED',
                            'pk': ['id VARCHAR(36)'], 'fk': ['poId VARCHAR(36) FK', 'medicineId VARCHAR(36) FK'],
                            'attrs': ['orderedQty INT', 'receivedQty INT', 'unitPrice DECIMAL', 'subtotal DECIMAL']},
    'purchases': {'x': 142, 'y': 75, 'w': 38, 'h': 34, 'color': '#9A3412', 'light': '#FFF7ED',
                  'pk': ['id VARCHAR(36)'], 'fk': ['poId VARCHAR(36) FK', 'supplierId VARCHAR(36) FK', 'createdBy VARCHAR(36) FK'],
                  'attrs': ['invoiceNumber VARCHAR(64)', 'purchaseDate DATE', 'totalAmount DECIMAL', 'paymentStatus VARCHAR(32)', 'createdAt TIMESTAMP']},

    # Batches and Movements
    'batches': {'x': 142, 'y': 15, 'w': 38, 'h': 45, 'color': '#6B21A8', 'light': '#FAF5FF',
                'pk': ['id VARCHAR(36)'], 'fk': ['medicineId VARCHAR(36) FK', 'supplierId VARCHAR(36) FK'],
                'attrs': ['batchNumber VARCHAR(64)', 'manufactureDate DATE', 'expiryDate DATE', 'costPrice DECIMAL', 'sellingPrice DECIMAL', 'mrp DECIMAL', 'quantityReceived INT', 'quantityAvailable INT', 'rackLocation VARCHAR(64)', 'createdAt TIMESTAMP']},
    'inventoryMovements': {'x': 95, 'y': 15, 'w': 40, 'h': 42, 'color': '#6B21A8', 'light': '#FAF5FF',
                           'pk': ['id VARCHAR(36)'], 'fk': ['medicineId VARCHAR(36) FK', 'batchId VARCHAR(36) FK', 'userId VARCHAR(36) FK'],
                           'attrs': ['movementType VARCHAR(32)', 'quantity INT', 'balanceAfter INT', 'referenceType VARCHAR(32)', 'referenceId VARCHAR(64)', 'notes VARCHAR(255)', 'createdAt TIMESTAMP']},

    # Clinical and Patients
    'customers': {'x': 10, 'y': 80, 'w': 36, 'h': 38, 'color': '#0E7490', 'light': '#ECFEFF',
                  'pk': ['id VARCHAR(36)'], 'fk': [],
                  'attrs': ['name VARCHAR(128)', 'phone VARCHAR(32)', 'email VARCHAR(128)', 'address TEXT', 'dateOfBirth DATE', 'creditLimit DECIMAL', 'outstandingBalance DEC', 'loyaltyPoints INT', 'createdAt TIMESTAMP']},
    'doctors': {'x': 52, 'y': 80, 'w': 38, 'h': 35, 'color': '#0E7490', 'light': '#ECFEFF',
                'pk': ['id VARCHAR(36)'], 'fk': [],
                'attrs': ['name VARCHAR(128)', 'specialization VARCHAR(100)', 'licenseNumber VARCHAR(64)', 'hospitalChamber VARCHAR(150)', 'phone VARCHAR(32)', 'email VARCHAR(128)', 'isActive BOOLEAN']},
    'prescriptions': {'x': 10, 'y': 25, 'w': 36, 'h': 38, 'color': '#0E7490', 'light': '#ECFEFF',
                      'pk': ['id VARCHAR(36)'], 'fk': ['customerId VARCHAR(36) FK', 'doctorId VARCHAR(36) FK'],
                      'attrs': ['prescriptionNumber VARCHAR(64)', 'prescriptionDate DATE', 'notes TEXT', 'status VARCHAR(32)', 'createdAt TIMESTAMP']},
    'prescriptionItems': {'x': 52, 'y': 25, 'w': 36, 'h': 32, 'color': '#0E7490', 'light': '#ECFEFF',
                          'pk': ['id VARCHAR(36)'], 'fk': ['prescriptionId VARCHAR(36) FK', 'medicineId VARCHAR(36) FK'],
                          'attrs': ['dosage VARCHAR(64)', 'durationDays INT', 'quantityPrescribed INT']},

    # Sales and Financials
    'sales': {'x': 52, 'y': 15, 'w': 36, 'h': 5, 'color': '#047857', 'light': '#ECFDF5', 'pk': [], 'fk': [], 'attrs': []} # will define full below
}
print('Script initialized')
