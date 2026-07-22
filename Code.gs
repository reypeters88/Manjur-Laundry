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
 * Format tanggal ke format DD-MM-YY untuk Kolom A di Google Spreadsheet
 */
function formatDateDDMMYY(dateInput) {
  if (!dateInput) dateInput = new Date();
  var d = new Date(dateInput);
  if (isNaN(d.getTime())) d = new Date();
  var day = ('0' + d.getDate()).slice(-2);
  var month = ('0' + (d.getMonth() + 1)).slice(-2);
  var year = d.getFullYear().toString().slice(-2);
  return day + '-' + month + '-' + year;
}

/**
 * Setup Awal: Otomatis membuat 6 Sheet yang dibutuhkan jika belum ada (Kolom A = Tanggal DD-MM-YY)
 */
function setupSpreadsheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheets = {
    'Users': ['Tanggal (DD-MM-YY)', 'id', 'name', 'username', 'password', 'role'],
    'Customers': ['Tanggal (DD-MM-YY)', 'id', 'name', 'phone', 'address', 'membership', 'total_weight'],
    'Services': ['Tanggal (DD-MM-YY)', 'id', 'name', 'price', 'unit', 'icon', 'category'],
    'Transactions': ['Tanggal (DD-MM-YY)', 'id', 'customerId', 'customerName', 'serviceId', 'serviceName', 'qty', 'isExpress', 'discount', 'totalCost', 'paidAmount', 'status', 'paymentStatus', 'paymentMethod', 'date', 'notes', 'perfumePrice', 'spottingPrice', 'items'],
    'Inventory': ['Tanggal (DD-MM-YY)', 'id', 'itemName', 'category', 'stock', 'unit', 'minStock', 'unitPrice', 'lastRestock'],
    'Finances': ['Tanggal (DD-MM-YY)', 'id', 'type', 'category', 'description', 'amount', 'date']
  };
  
  for (var sheetName in sheets) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheets[sheetName]);
      sheet.getRange(1, 1, 1, sheets[sheetName].length).setFontWeight('bold').setBackground('#0284c7').setFontColor('#ffffff');
      
      var tgl = formatDateDDMMYY(new Date());
      // Jika sheet Services baru dibuat, isi data default
      if (sheetName === 'Services') {
        sheet.appendRow([tgl, 'srv-1', 'Cuci Kiloan Reguler (2 Hari)', 7000, 'Kg', 'fa-shirt', 'Kiloan']);
        sheet.appendRow([tgl, 'srv-2', 'Cuci Kiloan Express (6 Jam)', 12000, 'Kg', 'fa-bolt', 'Express']);
        sheet.appendRow([tgl, 'srv-3', 'Setrika Saja (Kiloan)', 5000, 'Kg', 'fa-iron', 'Kiloan']);
        sheet.appendRow([tgl, 'srv-4', 'Cuci Satuan Jas / Kemeja', 20000, 'Pcs', 'fa-user-tie', 'Satuan']);
        sheet.appendRow([tgl, 'srv-5', 'Cuci Bedcover Besar', 35000, 'Pcs', 'fa-bed', 'Satuan']);
        sheet.appendRow([tgl, 'srv-6', 'Cuci Karpet Permadani', 15000, 'Meter', 'fa-scroll', 'Karpet']);
      }
      if (sheetName === 'Users') {
        sheet.appendRow([tgl, 'USR-01', 'Pak Manjur (Owner)', 'owner', 'admin123', 'Owner']);
        sheet.appendRow([tgl, 'USR-02', 'Mbak Dewi (Kasir)', 'kasir', 'kasir123', 'Kasir']);
        sheet.appendRow([tgl, 'USR-03', 'Mas Joko (Produksi)', 'produksi', 'prod123', 'Produksi']);
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
  var headers = data.length > 0 ? data[0] : [];
  var idCol = headers.indexOf('id');
  if (idCol === -1) idCol = 0;
  var nameCol = headers.indexOf('name');
  var priceCol = headers.indexOf('price');
  var unitCol = headers.indexOf('unit');
  var iconCol = headers.indexOf('icon');
  var catCol = headers.indexOf('category');
  
  if (payload.id && String(payload.id).startsWith('srv-')) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(payload.id)) {
        if (nameCol !== -1 && payload.name) sheet.getRange(i + 1, nameCol + 1).setValue(payload.name);
        if (priceCol !== -1 && payload.price !== undefined) sheet.getRange(i + 1, priceCol + 1).setValue(payload.price);
        if (unitCol !== -1 && payload.unit) sheet.getRange(i + 1, unitCol + 1).setValue(payload.unit);
        if (iconCol !== -1 && payload.icon) sheet.getRange(i + 1, iconCol + 1).setValue(payload.icon);
        if (catCol !== -1 && payload.category) sheet.getRange(i + 1, catCol + 1).setValue(payload.category);
        return { success: true, id: payload.id };
      }
    }
  }
  
  var newId = payload.id || 'srv-' + Date.now();
  var tgl = formatDateDDMMYY(new Date());
  sheet.appendRow([
    tgl,
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
  var headers = data.length > 0 ? data[0] : [];
  var idCol = headers.indexOf('id');
  if (idCol === -1) idCol = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(serviceId)) {
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
  var headers = data.length > 0 ? data[0] : [];
  var idCol = headers.indexOf('id');
  if (idCol === -1) idCol = 0;
  var nameCol = headers.indexOf('itemName');
  var catCol = headers.indexOf('category');
  var stockCol = headers.indexOf('stock');
  var unitCol = headers.indexOf('unit');
  var minCol = headers.indexOf('minStock');
  var priceCol = headers.indexOf('unitPrice');
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(payload.id)) {
      if (nameCol !== -1 && payload.itemName) sheet.getRange(i + 1, nameCol + 1).setValue(payload.itemName);
      if (catCol !== -1 && payload.category) sheet.getRange(i + 1, catCol + 1).setValue(payload.category);
      if (stockCol !== -1 && payload.stock !== undefined) sheet.getRange(i + 1, stockCol + 1).setValue(payload.stock);
      if (unitCol !== -1 && payload.unit) sheet.getRange(i + 1, unitCol + 1).setValue(payload.unit);
      if (minCol !== -1 && payload.minStock !== undefined) sheet.getRange(i + 1, minCol + 1).setValue(payload.minStock);
      if (priceCol !== -1 && payload.unitPrice !== undefined) sheet.getRange(i + 1, priceCol + 1).setValue(payload.unitPrice);
      break;
    }
  }
  return { success: true };
}

function deleteInventoryItem(itemId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Inventory');
  var data = sheet.getDataRange().getValues();
  var headers = data.length > 0 ? data[0] : [];
  var idCol = headers.indexOf('id');
  if (idCol === -1) idCol = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(itemId)) {
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
  var headers = data.length > 0 ? data[0] : [];
  var idCol = headers.indexOf('id');
  if (idCol === -1) idCol = 0;
  var custCol = headers.indexOf('customerName');
  var servCol = headers.indexOf('serviceName');
  var qtyCol = headers.indexOf('qty');
  var totalCol = headers.indexOf('totalCost');
  var paidCol = headers.indexOf('paidAmount');
  var statusCol = headers.indexOf('status');
  var payStatusCol = headers.indexOf('paymentStatus');
  var notesCol = headers.indexOf('notes');
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(payload.id)) {
      if (custCol !== -1 && payload.customerName) sheet.getRange(i + 1, custCol + 1).setValue(payload.customerName);
      if (servCol !== -1 && payload.serviceName) sheet.getRange(i + 1, servCol + 1).setValue(payload.serviceName);
      if (qtyCol !== -1 && payload.qty !== undefined) sheet.getRange(i + 1, qtyCol + 1).setValue(payload.qty);
      if (totalCol !== -1 && payload.totalCost !== undefined) sheet.getRange(i + 1, totalCol + 1).setValue(payload.totalCost);
      if (paidCol !== -1 && payload.paidAmount !== undefined) sheet.getRange(i + 1, paidCol + 1).setValue(payload.paidAmount);
      if (statusCol !== -1 && payload.status) sheet.getRange(i + 1, statusCol + 1).setValue(payload.status);
      if (payStatusCol !== -1 && payload.paymentStatus) sheet.getRange(i + 1, payStatusCol + 1).setValue(payload.paymentStatus);
      if (notesCol !== -1 && payload.notes !== undefined) sheet.getRange(i + 1, notesCol + 1).setValue(payload.notes);
      break;
    }
  }
  return { success: true };
}

/**
 * Simpan Transaksi Baru (Kolom A diawali dengan Tanggal DD-MM-YY)
 */
function saveTransaction(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Transactions');
  var now = payload.date ? new Date(payload.date) : new Date();
  var day = ('0' + now.getDate()).slice(-2);
  var month = ('0' + (now.getMonth() + 1)).slice(-2);
  var year = now.getFullYear().toString().slice(-2);
  var id = payload.id || 'MJL-' + day + month + year + '-' + ('00' + (Math.floor(Math.random() * 900) + 1)).slice(-3);
  var tgl = formatDateDDMMYY(now);
  var rowData = [
    tgl,
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
    payload.notes || '',
    payload.perfumePrice || 0,
    payload.spottingPrice || 0,
    JSON.stringify(payload.items || [])
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
  var headers = data.length > 0 ? data[0] : [];
  var idCol = headers.indexOf('id');
  if (idCol === -1) idCol = 0;
  var statusCol = headers.indexOf('status');
  var payStatusCol = headers.indexOf('paymentStatus');
  var paidCol = headers.indexOf('paidAmount');
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(payload.id)) {
      if (statusCol !== -1 && payload.status) sheet.getRange(i + 1, statusCol + 1).setValue(payload.status);
      if (payStatusCol !== -1 && payload.paymentStatus) sheet.getRange(i + 1, payStatusCol + 1).setValue(payload.paymentStatus);
      if (paidCol !== -1 && payload.paidAmount !== undefined) sheet.getRange(i + 1, paidCol + 1).setValue(payload.paidAmount);
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
  var headers = data.length > 0 ? data[0] : [];
  var idCol = headers.indexOf('id');
  if (idCol === -1) idCol = 0;
  var weightCol = headers.indexOf('total_weight');
  var memberCol = headers.indexOf('membership');
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(customerId)) {
      if (weightCol !== -1) {
        var currentWeight = parseFloat(data[i][weightCol]) || 0;
        var newWeight = currentWeight + addWeight;
        sheet.getRange(i + 1, weightCol + 1).setValue(newWeight);
        
        if (memberCol !== -1) {
          var newMember = 'Reguler';
          if (newWeight >= 50) newMember = 'Gold Member';
          else if (newWeight >= 20) newMember = 'Silver Member';
          sheet.getRange(i + 1, memberCol + 1).setValue(newMember);
        }
      }
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
  var headers = data.length > 0 ? data[0] : [];
  var idCol = headers.indexOf('id');
  if (idCol === -1) idCol = 0;
  var stockCol = headers.indexOf('stock');
  var restockCol = headers.indexOf('lastRestock');
  
  var restockQty = parseFloat(payload.addQty) || 0;
  var totalCost = parseFloat(payload.totalCost) || 0;
  var dateStr = payload.date || new Date().toISOString();
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(payload.id)) {
      if (stockCol !== -1) {
        var currentStock = parseFloat(data[i][stockCol]) || 0;
        sheet.getRange(i + 1, stockCol + 1).setValue(currentStock + restockQty);
      }
      if (restockCol !== -1) {
        sheet.getRange(i + 1, restockCol + 1).setValue(dateStr);
      }
      
      if (totalCost > 0) {
        addFinanceRecord({
          type: 'Pengeluaran',
          category: 'Restock Bahan',
          description: 'Restock ' + data[i][idCol === 0 ? 1 : idCol + 1] + ' sebanyak ' + restockQty + ' ' + (headers.indexOf('unit') !== -1 ? data[i][headers.indexOf('unit')] : ''),
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
  var tgl = formatDateDDMMYY(payload.date || new Date());
  sheet.appendRow([
    tgl,
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
  var headers = data.length > 0 ? data[0] : [];
  var idCol = headers.indexOf('id');
  if (idCol === -1) idCol = 0;
  var nameCol = headers.indexOf('name');
  var phoneCol = headers.indexOf('phone');
  var addrCol = headers.indexOf('address');
  
  if (payload.id) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(payload.id)) {
        if (nameCol !== -1 && payload.name) sheet.getRange(i + 1, nameCol + 1).setValue(payload.name);
        if (phoneCol !== -1 && payload.phone) sheet.getRange(i + 1, phoneCol + 1).setValue(payload.phone);
        if (addrCol !== -1 && payload.address) sheet.getRange(i + 1, addrCol + 1).setValue(payload.address);
        return { success: true, id: payload.id };
      }
    }
  }
  
  var newId = 'CUST-' + Date.now();
  var tgl = formatDateDDMMYY(new Date());
  sheet.appendRow([
    tgl,
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
  var headers = data.length > 0 ? data[0] : [];
  var idCol = headers.indexOf('id');
  if (idCol === -1) idCol = 0;
  var nameCol = headers.indexOf('name');
  var userCol = headers.indexOf('username');
  var passCol = headers.indexOf('password');
  var roleCol = headers.indexOf('role');
  
  if (payload.id && String(payload.id).startsWith('USR-')) {
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]) === String(payload.id)) {
        if (nameCol !== -1 && payload.name) sheet.getRange(i + 1, nameCol + 1).setValue(payload.name);
        if (userCol !== -1 && payload.username) sheet.getRange(i + 1, userCol + 1).setValue(payload.username);
        if (passCol !== -1 && payload.password) sheet.getRange(i + 1, passCol + 1).setValue(payload.password);
        if (roleCol !== -1 && payload.role) sheet.getRange(i + 1, roleCol + 1).setValue(payload.role);
        return { success: true, id: payload.id };
      }
    }
  }

  var newId = payload.id || 'USR-' + Date.now();
  var tgl = formatDateDDMMYY(new Date());
  sheet.appendRow([
    tgl,
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
  var headers = data.length > 0 ? data[0] : [];
  var idCol = headers.indexOf('id');
  if (idCol === -1) idCol = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(userId)) {
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
    { key: 'users', sheetName: 'Users', headers: ['Tanggal (DD-MM-YY)', 'id', 'name', 'username', 'password', 'role'] },
    { key: 'customers', sheetName: 'Customers', headers: ['Tanggal (DD-MM-YY)', 'id', 'name', 'phone', 'address', 'membership', 'total_weight'] },
    { key: 'services', sheetName: 'Services', headers: ['Tanggal (DD-MM-YY)', 'id', 'name', 'price', 'unit', 'icon', 'category'] },
    { key: 'transactions', sheetName: 'Transactions', headers: ['Tanggal (DD-MM-YY)', 'id', 'customerId', 'customerName', 'serviceId', 'serviceName', 'qty', 'isExpress', 'discount', 'totalCost', 'paidAmount', 'status', 'paymentStatus', 'paymentMethod', 'date', 'notes', 'perfumePrice', 'spottingPrice', 'items'] },
    { key: 'inventory', sheetName: 'Inventory', headers: ['Tanggal (DD-MM-YY)', 'id', 'itemName', 'category', 'stock', 'unit', 'minStock', 'unitPrice', 'lastRestock'] },
    { key: 'finances', sheetName: 'Finances', headers: ['Tanggal (DD-MM-YY)', 'id', 'type', 'category', 'description', 'amount', 'date'] }
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
            if (field === 'Tanggal (DD-MM-YY)') {
              row.push(formatDateDDMMYY(item.date || item.lastRestock || new Date()));
            } else {
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

