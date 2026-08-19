function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'getUsers') {
    var s = sheet.getSheetByName('Users');
    if (!s) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    var data = s.getDataRange().getValues();
    if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    var users = data.slice(1).map(function(r) {
      return {id:String(r[0]), phone:String(r[1]), password:r[2], name:r[3], status:r[4], joined:r[5]};
    });
    return ContentService.createTextOutput(JSON.stringify(users)).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getMessages') {
    var s = sheet.getSheetByName('Messages');
    if (!s) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    var data = s.getDataRange().getValues();
    if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    var msgs = data.slice(1).map(function(r) {
      var timeVal = r[3];
      if (timeVal instanceof Date) {
        try {
          timeVal = Utilities.formatDate(timeVal, sheet.getSpreadsheetTimeZone(), "HH:mm");
        } catch(err) {
          var hours = ("0" + timeVal.getHours()).slice(-2);
          var minutes = ("0" + timeVal.getMinutes()).slice(-2);
          timeVal = hours + ":" + minutes;
        }
      } else {
        timeVal = String(timeVal);
      }
      return {id:r[0], sender:r[1], message:r[2], time:timeVal, status:r[4], reactions:r[5] || '{}'};
    });
    return ContentService.createTextOutput(JSON.stringify(msgs)).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getReports') {
    var s = sheet.getSheetByName('Reports');
    var data = s.getDataRange().getValues();
    var reports = data.slice(1).map(function(r) {
      return {id:r[0], reporter:r[1], reason:r[2], date:r[3], status:r[4]};
    });
    return ContentService.createTextOutput(JSON.stringify(reports)).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getGallery') {
    var s = sheet.getSheetByName('Gallery');
    if (!s) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    var data = s.getDataRange().getValues();
    var items = data.slice(1).map(function(r) {
      return {id:r[0], url:r[1], title:r[2], uploader:r[3], date:r[4], likes:r[5]};
    });
    return ContentService.createTextOutput(JSON.stringify(items)).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getSettings') {
    var s = sheet.getSheetByName('Settings');
    if (!s) return ContentService.createTextOutput(JSON.stringify({})).setMimeType(ContentService.MimeType.JSON);
    var data = s.getDataRange().getValues();
    var settings = {};
    data.slice(1).forEach(function(r) { settings[r[0]] = r[1]; });
    return ContentService.createTextOutput(JSON.stringify(settings)).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'checkPhone') {
    var phone = e.parameter.phone;
    if (!phone) return ContentService.createTextOutput(JSON.stringify({exists:false})).setMimeType(ContentService.MimeType.JSON);
    var s = sheet.getSheetByName('Users');
    if (!s) return ContentService.createTextOutput(JSON.stringify({exists:false})).setMimeType(ContentService.MimeType.JSON);
    var data = s.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) == String(phone)) {
        return ContentService.createTextOutput(JSON.stringify({exists:true})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({exists:false})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'getComments') {
    var mediaId = e.parameter.mediaId;
    if (!mediaId) return ContentService.createTextOutput(JSON.stringify({success:false, error:'mediaId required'})).setMimeType(ContentService.MimeType.JSON);
    var s = sheet.getSheetByName('Comments');
    if (!s) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    var data = s.getDataRange().getValues();
    if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    var list = [];
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]) === String(mediaId)) {
        list.push({
          id: data[i][0],
          mediaId: data[i][1],
          phone: data[i][2],
          name: data[i][3] || 'Anonymous',
          comment: data[i][4],
          time: data[i][5]
        });
      }
    }
    return ContentService.createTextOutput(JSON.stringify(list)).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput('{"error":"unknown action"}').setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var action = data.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'addImage') {
    if (!data.url) return ContentService.createTextOutput(JSON.stringify({success:false, error:'URL required'})).setMimeType(ContentService.MimeType.JSON);
    var s = sheet.getSheetByName('Gallery');
    if (!s) return ContentService.createTextOutput(JSON.stringify({success:false, error:'Gallery sheet not found'})).setMimeType(ContentService.MimeType.JSON);
    var id = s.getLastRow();
    s.appendRow([id, data.url, data.title || '', data.uploader || '', data.date || new Date().toISOString().slice(0,10), data.likes || 0]);
    return ContentService.createTextOutput(JSON.stringify({success:true, id:id})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'deleteImage') {
    var s = sheet.getSheetByName('Gallery');
    var range = s.getDataRange();
    var values = range.getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] == data.id) {
        s.deleteRow(i+1);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'likeImage') {
    var s = sheet.getSheetByName('Gallery');
    var range = s.getDataRange();
    var values = range.getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] == data.id) {
        var currentLikes = parseInt(values[i][5]) || 0;
        s.getRange(i+1, 6).setValue(currentLikes + 1);
        return ContentService.createTextOutput(JSON.stringify({success:true, likes:currentLikes+1})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:false})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'addUser') {
    var s = sheet.getSheetByName('Users');
    var id = s.getLastRow();
    s.appendRow([id, data.phone, data.password || '', data.name || '', data.status || 'active', data.joined || new Date().toISOString().slice(0,10)]);
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'registerUser') {
    if (!data.phone) return ContentService.createTextOutput(JSON.stringify({success:false, error:'Phone required'})).setMimeType(ContentService.MimeType.JSON);
    var s = sheet.getSheetByName('Users');
    if (!s) return ContentService.createTextOutput(JSON.stringify({success:false, error:'Users sheet not found'})).setMimeType(ContentService.MimeType.JSON);
    var phone = String(data.phone);
    var range = s.getDataRange();
    var values = range.getValues();
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][1]) == phone) {
        s.getRange(i+1, 3).setValue(data.password || '');
        return ContentService.createTextOutput(JSON.stringify({success:true, id:values[i][0]})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    var id = s.getLastRow();
    s.appendRow([id, phone, data.password || '', '', 'active', new Date().toISOString().slice(0,10)]);
    s.getRange(s.getLastRow(), 2).setNumberFormat('@'); 
    return ContentService.createTextOutput(JSON.stringify({success:true, id:id})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'login') {
    if (!data.phone || !data.password) return ContentService.createTextOutput(JSON.stringify({success:false, error:'Phone and password required'})).setMimeType(ContentService.MimeType.JSON);
    var s = sheet.getSheetByName('Users');
    if (!s) return ContentService.createTextOutput(JSON.stringify({success:false, error:'Users sheet not found'})).setMimeType(ContentService.MimeType.JSON);
    var phone = String(data.phone);
    var range = s.getDataRange();
    var values = range.getValues();
    for (var i = 1; i < values.length; i++) {
      if (String(values[i][1]) == phone) {
        if (values[i][2] == data.password) {
          return ContentService.createTextOutput(JSON.stringify({success:true, id:values[i][0], name:values[i][3] || ''})).setMimeType(ContentService.MimeType.JSON);
        } else {
          return ContentService.createTextOutput(JSON.stringify({success:false, error:'Wrong password'})).setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:false, error:'User not found'})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'updateUser') {
    var s = sheet.getSheetByName('Users');
    var range = s.getDataRange();
    var values = range.getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] == data.id) {
        if (data.name !== undefined) s.getRange(i+1, 4).setValue(data.name);
        if (data.phone !== undefined) s.getRange(i+1, 2).setValue(data.phone);
        if (data.password !== undefined) s.getRange(i+1, 3).setValue(data.password);
        if (data.status !== undefined) s.getRange(i+1, 5).setValue(data.status);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'deleteUser') {
    var s = sheet.getSheetByName('Users');
    var range = s.getDataRange();
    var values = range.getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] == data.id) {
        s.deleteRow(i+1);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'addMessage') {
    if (!data.message) return ContentService.createTextOutput(JSON.stringify({success:false, error:'Message required'})).setMimeType(ContentService.MimeType.JSON);
    var s = sheet.getSheetByName('Messages');
    if (!s) return ContentService.createTextOutput(JSON.stringify({success:false, error:'Messages sheet not found'})).setMimeType(ContentService.MimeType.JSON);
    var id = s.getLastRow();
    s.appendRow([id, String(data.sender || 'Anonymous'), data.message, data.time || '', data.status || 'unread', '{}']);
    try {
      s.getRange(s.getLastRow(), 4).setNumberFormat('@');
    } catch(e) {}
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'updateMessage') {
    var s = sheet.getSheetByName('Messages');
    var range = s.getDataRange();
    var values = range.getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] == data.id) {
        s.getRange(i+1, 2).setValue(data.sender);
        s.getRange(i+1, 3).setValue(data.message);
        s.getRange(i+1, 4).setValue(data.time);
        s.getRange(i+1, 5).setValue(data.status);
        if (data.reactions !== undefined) s.getRange(i+1, 6).setValue(data.reactions);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === 'reactToMessage') {
    if (!data.id || !data.phone || !data.emoji) return ContentService.createTextOutput(JSON.stringify({success:false, error:'Missing parameters'})).setMimeType(ContentService.MimeType.JSON);
    var s = sheet.getSheetByName('Messages');
    if (!s) return ContentService.createTextOutput(JSON.stringify({success:false, error:'Messages sheet not found'})).setMimeType(ContentService.MimeType.JSON);
    var range = s.getDataRange();
    var values = range.getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] == data.id) {
        var reactionsStr = values[i][5] || '{}';
        var reactionsObj = {};
        try {
          reactionsObj = JSON.parse(reactionsStr);
        } catch(e) {}
        
        if (reactionsObj[data.phone] === data.emoji) {
          delete reactionsObj[data.phone];
        } else {
          reactionsObj[data.phone] = data.emoji;
        }
        s.getRange(i+1, 6).setValue(JSON.stringify(reactionsObj));
        return ContentService.createTextOutput(JSON.stringify({success:true, reactions:reactionsObj})).setMimeType(ContentService.MimeType.JSON);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:false, error:'Message not found'})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'deleteMessage') {
    var s = sheet.getSheetByName('Messages');
    var range = s.getDataRange();
    var values = range.getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] == data.id) {
        s.deleteRow(i+1);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'addReport') {
    var s = sheet.getSheetByName('Reports');
    var id = s.getLastRow();
    s.appendRow([id, data.reporter, data.reason, data.date, data.status]);
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'updateReport') {
    var s = sheet.getSheetByName('Reports');
    var range = s.getDataRange();
    var values = range.getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] == data.id) {
        s.getRange(i+1, 2).setValue(data.reporter);
        s.getRange(i+1, 3).setValue(data.reason);
        s.getRange(i+1, 4).setValue(data.date);
        s.getRange(i+1, 5).setValue(data.status);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'deleteReport') {
    var s = sheet.getSheetByName('Reports');
    var range = s.getDataRange();
    var values = range.getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] == data.id) {
        s.deleteRow(i+1);
        break;
      }
    }
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'updateSettings') {
    var s = sheet.getSheetByName('Settings');
    var settings = data.settings;
    s.getRange(2, 2).setValue(settings.siteName || '');
    s.getRange(3, 2).setValue(settings.email || '');
    s.getRange(4, 2).setValue(settings.description || '');
    s.getRange(5, 2).setValue(settings.maintenance || 'off');
    s.getRange(6, 2).setValue(settings.registration || 'on');
    s.getRange(7, 2).setValue(settings.notifications || 'on');
    s.getRange(8, 2).setValue(settings.autoDelete || 'off');
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === 'addComment') {
    if (!data.mediaId || !data.comment || !data.phone) {
      return ContentService.createTextOutput(JSON.stringify({success:false, error:'Missing parameters'})).setMimeType(ContentService.MimeType.JSON);
    }
    var s = sheet.getSheetByName('Comments');
    if (!s) {
      s = sheet.insertSheet('Comments');
      s.appendRow(['id', 'mediaId', 'phone', 'name', 'comment', 'time']);
    }
    var id = s.getLastRow();
    s.appendRow([id, String(data.mediaId), String(data.phone), data.name || 'Anonymous', data.comment, new Date().toISOString()]);
    return ContentService.createTextOutput(JSON.stringify({success:true})).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput('{"error":"unknown action"}').setMimeType(ContentService.MimeType.JSON);
}
