/**
 * Code.gs - Backend Google Apps Script untuk Webapp Manjur Laundry
 * "Bersih, Harum, Cepat, & Manjur!"
 * Versi 1.2 - Dengan RBAC Owner Lengkap (Edit Harga, Layanan, Inventory, Transaksi)
 */

function doGet(e) {
  if (e && e.parameter && (e.parameter.action === 'getInitialData' || e.parameter.api === 'true')) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: getInitialData()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Manjur Laundry - Sistem Kas & Keuangan')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Setup Awal: Otomatis membuat 6 Sheet yang dibutuhkan jika belum ada
 */
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheets = {
    'Users': ['id', 'name', 'username', 'password', 'role'],
    'Customers': ['id', 'name', 'phone', 'address', 'membership', 'total_weight'],
    'Services': ['id', 'name', 'price', 'unit', 'icon', 'category'],
    'Transactions': ['id', 'customerId', 'customerName', 'serviceId', 'serviceName', 'qty', 'isExpress', 'discount', 'totalCost', 'paidAmount', 'status', 'paymentStatus', 'paymentMethod', 'date', 'notes', 'perfumePrice', 'spottingPrice', 'items'],
    'Inventory': ['id', 'itemName', 'category', 'stock', 'unit', 'minStock', 'unitPrice', 'lastRestock'],
    'Finances': ['id', 'type', 'category', 'description', 'amount', 'date']
  };
  
  for (var sheetName in sheets) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheets[sheetName]);
      sheet.getRange(1, 1, 1, sheets[sheetName].length).setFontWeight('bold').setBackground('#0284c7').setFontColor('#ffffff');
      
      // Jika sheet Services baru dibuat, isi data default
      if (sheetName === 'Services') {
        sheet.appendRow(['srv-1', 'Cuci Kiloan Reguler (2 Hari)', 7000, 'Kg', 'fa-shirt', 'Kiloan']);
        sheet.appendRow(['srv-2', 'Cuci Kiloan Express (6 Jam)', 12000, 'Kg', 'fa-bolt', 'Express']);
        sheet.appendRow(['srv-3', 'Setrika Saja (Kiloan)', 5000, 'Kg', 'fa-iron', 'Kiloan']);
        sheet.appendRow(['srv-4', 'Cuci Satuan Jas / Kemeja', 20000, 'Pcs', 'fa-user-tie', 'Satuan']);
        sheet.appendRow(['srv-5', 'Cuci Bedcover Besar', 35000, 'Pcs', 'fa-bed', 'Satuan']);
        sheet.appendRow(['srv-6', 'Cuci Karpet Permadani', 15000, 'Meter', 'fa-scroll', 'Karpet']);
      }
      if (sheetName === 'Users') {
        sheet.appendRow(['USR-01', 'Pak Manjur (Owner)', 'owner', 'admin123', 'Owner']);
        sheet.appendRow(['USR-02', 'Mbak Dewi (Kasir)', 'kasir', 'kasir123', 'Kasir']);
        sheet.appendRow(['USR-03', 'Mas Joko (Produksi)', 'produksi', 'prod123', 'Produksi']);
      }
    }
  }
  return "Setup spreadsheet selesai!";
}

/**
 * Endpoint API untuk permintaan dari Frontend
 */
function getInitialData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSpreadsheet(); // Pastikan sheet ada
  
  return {
    users: getSheetData('Users'),
    customers: getSheetData('Customers'),
    services: getSheetData('Services'),
    transactions: getSheetData('Transactions'),
    inventory: getSheetData('Inventory'),
    finances: getSheetData('Finances')
  };
}

function getSheetData(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    rows.push(obj);
  }
  return rows;
}

/**
 * [KHUSUS OWNER] Manajemen Layanan & Harga
 */
function saveService(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Services');
  var data = sheet.getDataRange().getValues();
  
  if (payload.id && String(payload.id).startsWith('srv-')) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(payload.id)) {
        sheet.getRange(i + 1, 2).setValue(payload.name);
        sheet.getRange(i + 1, 3).setValue(payload.price);
        sheet.getRange(i + 1, 4).setValue(payload.unit);
        if (payload.icon) sheet.getRange(i + 1, 5).setValue(payload.icon);
        if (payload.category) sheet.getRange(i + 1, 6).setValue(payload.category);
        return { success: true, id: payload.id };
      }
    }
  }
  
  var newId = payload.id || 'srv-' + Date.now();
  sheet.appendRow([
    newId,
    payload.name || '',
    payload.price || 0,
    payload.unit || 'Kg',
    payload.icon || 'fa-shirt',
    payload.category || 'Kiloan'
  ]);
  return { success: true, id: newId };
}

function deleteService(serviceId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Services');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(serviceId)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return { success: true };
}

/**
 * [KHUSUS OWNER] Edit & Hapus Inventory Item
 */
function updateInventoryItem(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Inventory');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(payload.id)) {
      if (payload.itemName) sheet.getRange(i + 1, 2).setValue(payload.itemName);
      if (payload.category) sheet.getRange(i + 1, 3).setValue(payload.category);
      if (payload.stock !== undefined) sheet.getRange(i + 1, 4).setValue(payload.stock);
      if (payload.unit) sheet.getRange(i + 1, 5).setValue(payload.unit);
      if (payload.minStock !== undefined) sheet.getRange(i + 1, 6).setValue(payload.minStock);
      if (payload.unitPrice !== undefined) sheet.getRange(i + 1, 7).setValue(payload.unitPrice);
      break;
    }
  }
  return { success: true };
}

function deleteInventoryItem(itemId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Inventory');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(itemId)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return { success: true };
}

/**
 * [KHUSUS OWNER] Edit Data Transaksi
 */
function updateTransactionFull(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Transactions');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(payload.id)) {
      if (payload.customerName) sheet.getRange(i + 1, 3).setValue(payload.customerName);
      if (payload.serviceName) sheet.getRange(i + 1, 5).setValue(payload.serviceName);
      if (payload.qty !== undefined) sheet.getRange(i + 1, 6).setValue(payload.qty);
      if (payload.totalCost !== undefined) sheet.getRange(i + 1, 9).setValue(payload.totalCost);
      if (payload.paidAmount !== undefined) sheet.getRange(i + 1, 10).setValue(payload.paidAmount);
      if (payload.status) sheet.getRange(i + 1, 11).setValue(payload.status);
      if (payload.paymentStatus) sheet.getRange(i + 1, 12).setValue(payload.paymentStatus);
      if (payload.notes !== undefined) sheet.getRange(i + 1, 15).setValue(payload.notes);
      break;
    }
  }
  return { success: true };
}

/**
 * Simpan Transaksi Baru
 */
function saveTransaction(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Transactions');
  
  var id = payload.id || 'TRX-' + Date.now();
  var rowData = [
    id,
    payload.customerId || '',
    payload.customerName || '',
    payload.serviceId || '',
    payload.serviceName || '',
    payload.qty || 0,
    payload.isExpress ? 'Ya' : 'Tidak',
    payload.discount || 0,
    payload.totalCost || 0,
    payload.paidAmount || 0,
    payload.status || 'Antrean',
    payload.paymentStatus || 'Belum Lunas',
    payload.paymentMethod || 'Tunai',
    payload.date || new Date().toISOString(),
    payload.notes || ''
  ];
  
  sheet.appendRow(rowData);
  
  if (payload.customerId && payload.qty) {
    updateCustomerWeight(payload.customerId, parseFloat(payload.qty) || 0);
  }
  
  if (payload.paidAmount && parseFloat(payload.paidAmount) > 0) {
    addFinanceRecord({
      type: 'Pemasukan',
      category: 'Transaksi Laundry',
      description: 'Pemasukan dari nota #' + id + ' (' + payload.customerName + ')',
      amount: payload.paidAmount,
      date: payload.date || new Date().toISOString()
    });
  }
  
  return { success: true, id: id };
}

/**
 * Update Status Transaksi
 */
function updateOrderStatus(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Transactions');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(payload.id)) {
      if (payload.status) sheet.getRange(i + 1, 11).setValue(payload.status);
      if (payload.paymentStatus) sheet.getRange(i + 1, 12).setValue(payload.paymentStatus);
      if (payload.paidAmount !== undefined) sheet.getRange(i + 1, 10).setValue(payload.paidAmount);
      break;
    }
  }
  return { success: true };
}

/**
 * Update Berat Cucian Customer
 */
function updateCustomerWeight(customerId, addWeight) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Customers');
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(customerId)) {
      var currentWeight = parseFloat(data[i][5]) || 0;
      var newWeight = currentWeight + addWeight;
      sheet.getRange(i + 1, 6).setValue(newWeight);
      
      var newMember = 'Reguler';
      if (newWeight >= 50) newMember = 'Gold Member';
      else if (newWeight >= 20) newMember = 'Silver Member';
      
      sheet.getRange(i + 1, 5).setValue(newMember);
      break;
    }
  }
}

/**
 * Restock Inventory & Otomatis Catat Pengeluaran
 */
function restockItem(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Inventory');
  var data = sheet.getDataRange().getValues();
  
  var restockQty = parseFloat(payload.addQty) || 0;
  var totalCost = parseFloat(payload.totalCost) || 0;
  var dateStr = payload.date || new Date().toISOString();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(payload.id)) {
      var currentStock = parseFloat(data[i][3]) || 0;
      sheet.getRange(i + 1, 4).setValue(currentStock + restockQty);
      sheet.getRange(i + 1, 8).setValue(dateStr);
      
      if (totalCost > 0) {
        addFinanceRecord({
          type: 'Pengeluaran',
          category: 'Restock Bahan',
          description: 'Restock ' + data[i][1] + ' sebanyak ' + restockQty + ' ' + data[i][4],
          amount: totalCost,
          date: dateStr
        });
      }
      break;
    }
  }
  return { success: true };
}

function addFinanceRecord(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Finances');
  
  var id = 'FIN-' + Date.now() + Math.floor(Math.random()*100);
  sheet.appendRow([
    id,
    payload.type || 'Pemasukan',
    payload.category || 'Umum',
    payload.description || '',
    payload.amount || 0,
    payload.date || new Date().toISOString()
  ]);
  return { success: true, id: id };
}

function saveCustomer(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Customers');
  var data = sheet.getDataRange().getValues();
  
  if (payload.id) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(payload.id)) {
        sheet.getRange(i + 1, 2).setValue(payload.name);
        sheet.getRange(i + 1, 3).setValue(payload.phone);
        sheet.getRange(i + 1, 4).setValue(payload.address);
        return { success: true, id: payload.id };
      }
    }
  }
  
  var newId = 'CUST-' + Date.now();
  sheet.appendRow([
    newId,
    payload.name || '',
    payload.phone || '',
    payload.address || '',
    payload.membership || 'Reguler',
    0
  ]);
  return { success: true, id: newId };
}

function saveUser(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Users');
  var data = sheet.getDataRange().getValues();
  
  if (payload.id && String(payload.id).startsWith('USR-')) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(payload.id)) {
        if (payload.name) sheet.getRange(i + 1, 2).setValue(payload.name);
        if (payload.username) sheet.getRange(i + 1, 3).setValue(payload.username);
        if (payload.password) sheet.getRange(i + 1, 4).setValue(payload.password);
        if (payload.role) sheet.getRange(i + 1, 5).setValue(payload.role);
        return { success: true, id: payload.id };
      }
    }
  }

  var newId = payload.id || 'USR-' + Date.now();
  sheet.appendRow([
    newId,
    payload.name || '',
    payload.username || '',
    payload.password || 'admin123',
    payload.role || 'Kasir'
  ]);
  return { success: true, id: newId };
}

function deleteUser(userId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Users');
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
  return { success: true };
}

/**
 * Endpoint REST POST API untuk Sinkronisasi Data dari Webapp / Frontend
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    
    if (action === 'syncAll' || action === 'pushAll') {
      var result = syncAllDataToSpreadsheet(payload.data || payload);
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Sinkronisasi berhasil disimpan ke Spreadsheet',
        result: result
      })).setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'saveTransaction') {
      var res = saveTransaction(payload.data || payload);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', result: res })).setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'saveService') {
      var resSrv = saveService(payload.data || payload);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', result: resSrv })).setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'saveCustomer') {
      var resCust = saveCustomer(payload.data || payload);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', result: resCust })).setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'saveUser') {
      var resUsr = saveUser(payload.data || payload);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', result: resUsr })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'Action tidak dikenal: ' + action
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Sinkronisasi Seluruh Data dari Frontend ke Google Spreadsheet
 */
function syncAllDataToSpreadsheet(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSpreadsheet();
  
  var mappings = [
    { key: 'users', sheetName: 'Users', headers: ['id', 'name', 'username', 'password', 'role'] },
    { key: 'customers', sheetName: 'Customers', headers: ['id', 'name', 'phone', 'address', 'membership', 'total_weight'] },
    { key: 'services', sheetName: 'Services', headers: ['id', 'name', 'price', 'unit', 'icon', 'category'] },
    { key: 'transactions', sheetName: 'Transactions', headers: ['id', 'customerId', 'customerName', 'serviceId', 'serviceName', 'qty', 'isExpress', 'discount', 'totalCost', 'paidAmount', 'status', 'paymentStatus', 'paymentMethod', 'date', 'notes', 'perfumePrice', 'spottingPrice', 'items'] },
    { key: 'inventory', sheetName: 'Inventory', headers: ['id', 'itemName', 'category', 'stock', 'unit', 'minStock', 'unitPrice', 'lastRestock'] },
    { key: 'finances', sheetName: 'Finances', headers: ['id', 'type', 'category', 'description', 'amount', 'date'] }
  ];
  
  var updatedCounts = {};
  
  for (var m = 0; m < mappings.length; m++) {
    var map = mappings[m];
    if (data[map.key] && Array.isArray(data[map.key])) {
      var sheet = ss.getSheetByName(map.sheetName);
      if (sheet) {
        sheet.clearContents();
        sheet.appendRow(map.headers);
        
        var rows = [];
        for (var r = 0; r < data[map.key].length; r++) {
          var item = data[map.key][r];
          var row = [];
          for (var h = 0; h < map.headers.length; h++) {
            var field = map.headers[h];
            var val = item[field];
            if (val !== undefined && val !== null) {
              if (typeof val === 'object') {
                row.push(JSON.stringify(val));
              } else {
                row.push(val);
              }
            } else {
              row.push('');
            }
          }
          rows.push(row);
        }
        
        if (rows.length > 0) {
          sheet.getRange(2, 1, rows.length, map.headers.length).setValues(rows);
        }
        updatedCounts[map.key] = rows.length;
      }
    }
  }
  
  return updatedCounts;
}

