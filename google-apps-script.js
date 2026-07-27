// ============================================================
// GOOGLE APPS SCRIPT — Code.gs
// Salin kode ini ke Google Apps Script (script.google.com)
// ============================================================
// SETUP:
// 1. Buka Google Sheets, buat spreadsheet baru
// 2. Buat 5 sheet: "Users", "Posts", "Likes", "Comments", "OTPLogs", "AnonMessages"
// 3. Sheet "Users" header: phone | password | name | bio | photoUrl | instagram | linkedin | tiktok
// 4. Sheet "Posts" header: id | phone | name | mediaUrl | mediaType | caption | timestamp
// 5. Sheet "Likes" header: postId | phone
// 6. Sheet "Comments" header: postId | phone | name | text | timestamp
// 7. Sheet "OTPLogs" header: phone | otp | expiresAt | attempts | createdAt
// 8. Sheet "AnonMessages" header: id | text | senderName | timestamp | reactionsJSON
// 9. Buka Extensions > Apps Script
// 10. Paste kode ini, klik Deploy > New Deployment > Web App
// 11. Set "Who has access" = "Anyone", Deploy
// 12. Copy URL deployment, paste ke script.js (variabel API_URL)
// ============================================================

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    let result;
    switch (action) {
      case 'register':
        result = handleRegister(data);
        break;
      case 'login':
        result = handleLogin(data);
        break;
      case 'updateProfile':
        result = handleUpdateProfile(data);
        break;
      case 'getUser':
        result = handleGetUser(data);
        break;
      case 'createPost':
        result = handleCreatePost(data);
        break;
      case 'getPosts':
        result = handleGetPosts(data);
        break;
      case 'likePost':
        result = handleLikePost(data);
        break;
      case 'addComment':
        result = handleAddComment(data);
        break;
      case 'getComments':
        result = handleGetComments(data);
        break;
      case 'getMembers':
        result = handleGetMembers();
        break;
      case 'updateSocials':
        result = handleUpdateSocials(data);
        break;
      case 'deletePost':
        result = handleDeletePost(data);
        break;
      case 'sendAnonymousMessage':
        result = handleSendAnonymousMessage(data);
        break;
      case 'getAnonymousMessages':
        result = handleGetAnonymousMessages(data);
        break;
      case 'reactAnonymousMessage':
        result = handleReactAnonymousMessage(data);
        break;
      case 'sendOtp':
        result = handleSendOtp(data);
        break;
      case 'verifyOtp':
        result = handleVerifyOtp(data);
        break;
      case 'loginPassword':
        result = handleLoginPassword(data);
        break;
      case 'registerPassword':
        result = handleRegisterPassword(data);
        break;
      default:
        result = { success: false, message: 'Unknown action' };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const action = e.parameter.action;
  let result;
  
  switch (action) {
    case 'getPosts':
      result = handleGetPosts(e.parameter);
      break;
    case 'getComments':
      result = handleGetComments(e.parameter);
      break;
    case 'getAnonymousMessages':
      result = handleGetAnonymousMessages(e.parameter);
      break;
    default:
      result = { success: true, message: 'API is running' };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- HELPER ----

// Normalisasi nomor HP agar format konsisten
// Google Sheets sering menyimpan 08xx sebagai angka 8xx (hilang 0 di depan)
function normalizePhone(phone) {
  let p = String(phone).trim();
  // Hapus semua non-digit
  p = p.replace(/\D/g, '');
  // Jika dimulai dengan 62, ubah ke 0
  if (p.startsWith('62')) p = '0' + p.substring(2);
  // Jika tidak dimulai dengan 0, tambahkan 0
  if (!p.startsWith('0')) p = '0' + p;
  return p;
}

// ---- USER MANAGEMENT ----

function handleRegister(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const phones = sheet.getRange('A2:A').getValues().flat().filter(String);
  
  if (phones.includes(data.phone)) {
    return { success: false, message: 'Nomor HP sudah terdaftar' };
  }
  
  // Generate random 4-digit code
  const code = String(Math.floor(1000 + Math.random() * 9000));
  
  sheet.appendRow([data.phone, code, data.name, '', '']);
  
  return { 
    success: true, 
    message: 'Registrasi berhasil!', 
    code: code,
    user: { phone: data.phone, name: data.name, bio: '', photoUrl: '' }
  };
}

function handleLogin(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  const inputPhone = normalizePhone(data.phone);
  const inputCode = String(data.code).trim();
  
  for (let i = 1; i < rows.length; i++) {
    const rowPhone = normalizePhone(rows[i][0]);
    const rowCode = String(rows[i][1]).trim();
    if (rowPhone === inputPhone && rowCode === inputCode) {
      return { 
        success: true, 
        message: 'Login berhasil!',
        user: {
          phone: rowPhone,
          name: rows[i][2],
          bio: rows[i][3] || '',
          photoUrl: rows[i][4] || ''
        }
      };
    }
  }
  
  return { success: false, message: 'Nomor HP atau kode salah' };
}

function handleGetUser(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const rows = sheet.getDataRange().getValues();
  const inputPhone = normalizePhone(data.phone);
  
  for (let i = 1; i < rows.length; i++) {
    if (normalizePhone(rows[i][0]) === inputPhone) {
      return {
        success: true,
        user: {
          phone: normalizePhone(rows[i][0]),
          name: rows[i][2],
          bio: rows[i][3] || '',
          photoUrl: rows[i][4] || ''
        }
      };
    }
  }
  
  return { success: false, message: 'User tidak ditemukan' };
}

function handleUpdateProfile(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if (!sheet) return { success: false, message: 'Sheet Users tidak ditemukan' };
  const rows = sheet.getDataRange().getValues();
  const inputPhone = normalizePhone(data.phone);
  
  for (let i = 1; i < rows.length; i++) {
    if (normalizePhone(rows[i][0]) === inputPhone) {
      const row = i + 1;
      if (data.name) sheet.getRange(row, 3).setValue(data.name);
      if (data.bio !== undefined) sheet.getRange(row, 4).setValue(data.bio);
      if (data.photoUrl) sheet.getRange(row, 5).setValue(data.photoUrl);
      
      return { 
        success: true, 
        message: 'Profil berhasil diperbarui',
        user: {
          phone: inputPhone,
          name: data.name || rows[i][2],
          bio: data.bio !== undefined ? data.bio : rows[i][3],
          photoUrl: data.photoUrl || rows[i][4]
        }
      };
    }
  }
  
  return { success: false, message: 'User tidak ditemukan' };
}

// ---- POST MANAGEMENT ----

function handleCreatePost(data) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Posts');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Posts');
    sheet.appendRow(['id', 'phone', 'name', 'mediaUrl', 'mediaType', 'caption', 'timestamp']);
  }
  const id = Utilities.getUuid();
  const timestamp = new Date().toISOString();
  
  sheet.appendRow([id, data.phone, data.name, data.mediaUrl, data.mediaType, data.caption, timestamp]);
  
  return { 
    success: true, 
    message: 'Postingan berhasil dipublikasikan!',
    post: { id, phone: data.phone, name: data.name, mediaUrl: data.mediaUrl, mediaType: data.mediaType, caption: data.caption, timestamp }
  };
}

function handleDeletePost(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const postSheet = ss.getSheetByName('Posts');
  const likeSheet = ss.getSheetByName('Likes');
  const commentSheet = ss.getSheetByName('Comments');
  if (!postSheet) return { success: false, message: 'Sheet Posts tidak ditemukan' };
  const postRows = postSheet.getDataRange().getValues();
  const inputPhone = normalizePhone(data.phone);
  
  // Find and verify ownership
  for (let i = 1; i < postRows.length; i++) {
    if (postRows[i][0] === data.postId) {
      if (normalizePhone(postRows[i][1]) !== inputPhone) {
        return { success: false, message: 'Anda tidak bisa menghapus postingan orang lain' };
      }
      // Delete associated likes (from bottom to top)
      if (likeSheet) {
        const likeRows = likeSheet.getDataRange().getValues();
        for (let j = likeRows.length - 1; j >= 1; j--) {
          if (likeRows[j][0] === data.postId) likeSheet.deleteRow(j + 1);
        }
      }
      // Delete associated comments (from bottom to top)
      if (commentSheet) {
        const commentRows = commentSheet.getDataRange().getValues();
        for (let j = commentRows.length - 1; j >= 1; j--) {
          if (commentRows[j][0] === data.postId) commentSheet.deleteRow(j + 1);
        }
      }
      // Delete the post
      postSheet.deleteRow(i + 1);
      return { success: true, message: 'Postingan berhasil dihapus' };
    }
  }
  
  return { success: false, message: 'Postingan tidak ditemukan' };
}

function handleGetPosts() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const postSheet = ss.getSheetByName('Posts');
  const likeSheet = ss.getSheetByName('Likes');
  const commentSheet = ss.getSheetByName('Comments');
  const userSheet = ss.getSheetByName('Users');
  
  if (!postSheet) return { success: true, posts: [] };
  
  const postRows = postSheet.getDataRange().getValues();
  const likeRows = likeSheet ? likeSheet.getDataRange().getValues() : [];
  const commentRows = commentSheet ? commentSheet.getDataRange().getValues() : [];
  const userRows = userSheet ? userSheet.getDataRange().getValues() : [];
  
  // Build user map for photo URLs
  const userMap = {};
  for (let i = 1; i < userRows.length; i++) {
    userMap[userRows[i][0]] = {
      name: userRows[i][2],
      photoUrl: userRows[i][4] || ''
    };
  }
  
  const posts = [];
  for (let i = postRows.length - 1; i >= 1; i--) {
    const postId = postRows[i][0];
    const phone = postRows[i][1];
    
    // Count likes
    const likes = likeRows.filter((r, idx) => idx > 0 && r[0] === postId).length;
    
    // Count comments
    const comments = commentRows.filter((r, idx) => idx > 0 && r[0] === postId).length;
    
    // Get likers
    const likedBy = likeRows.filter((r, idx) => idx > 0 && r[0] === postId).map(r => r[1]);
    
    const author = userMap[phone] || { name: postRows[i][2], photoUrl: '' };
    
    posts.push({
      id: postId,
      phone: phone,
      name: postRows[i][2],
      authorPhoto: author.photoUrl,
      mediaUrl: postRows[i][3],
      mediaType: postRows[i][4],
      caption: postRows[i][5],
      timestamp: postRows[i][6],
      likes: likes,
      likedBy: likedBy,
      commentCount: comments
    });
  }
  
  return { success: true, posts };
}

// ---- LIKES ----

function handleLikePost(data) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Likes');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Likes');
    sheet.appendRow(['postId', 'phone']);
  }
  const rows = sheet.getDataRange().getValues();
  
  // Check if already liked
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.postId && rows[i][1] === data.phone) {
      // Unlike — delete the row
      sheet.deleteRow(i + 1);
      return { success: true, liked: false, message: 'Like dibatalkan' };
    }
  }
  
  // Like
  sheet.appendRow([data.postId, data.phone]);
  return { success: true, liked: true, message: 'Berhasil like!' };
}

// ---- COMMENTS ----

function handleAddComment(data) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Comments');
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Comments');
    sheet.appendRow(['postId', 'phone', 'name', 'text', 'timestamp']);
  }
  const timestamp = new Date().toISOString();
  
  sheet.appendRow([data.postId, data.phone, data.name, data.text, timestamp]);
  
  return { 
    success: true, 
    message: 'Komentar ditambahkan',
    comment: { postId: data.postId, phone: data.phone, name: data.name, text: data.text, timestamp }
  };
}

function handleGetComments(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const commentSheet = ss.getSheetByName('Comments');
  const userSheet = ss.getSheetByName('Users');
  if (!commentSheet) return { success: true, comments: [] };
  const rows = commentSheet.getDataRange().getValues();
  const userRows = userSheet ? userSheet.getDataRange().getValues() : [];
  
  const userMap = {};
  for (let i = 1; i < userRows.length; i++) {
    userMap[userRows[i][0]] = { name: userRows[i][2], photoUrl: userRows[i][4] || '' };
  }
  
  const comments = [];
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.postId) {
      const user = userMap[rows[i][1]] || { name: rows[i][2], photoUrl: '' };
      comments.push({
        phone: rows[i][1],
        name: user.name || rows[i][2],
        photoUrl: user.photoUrl,
        text: rows[i][3],
        timestamp: rows[i][4]
      });
    }
  }
  
  return { success: true, comments };
}

// ---- MEMBERS ----

function handleGetMembers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if (!sheet) return { success: true, members: [] };
  const rows = sheet.getDataRange().getValues();
  
  const members = [];
  for (let i = 1; i < rows.length; i++) {
    members.push({
      phone: normalizePhone(rows[i][0]),
      name: rows[i][2] || '',
      bio: rows[i][3] || '',
      photoUrl: rows[i][4] || '',
      instagram: rows[i][5] || '',
      linkedin: rows[i][6] || '',
      tiktok: rows[i][7] || ''
    });
  }
  
  return { success: true, members };
}

function handleUpdateSocials(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  if (!sheet) return { success: false, message: 'Sheet Users tidak ditemukan' };
  const rows = sheet.getDataRange().getValues();
  const inputPhone = normalizePhone(data.phone);
  
  for (let i = 1; i < rows.length; i++) {
    if (normalizePhone(rows[i][0]) === inputPhone) {
      const row = i + 1;
      if (data.instagram !== undefined) sheet.getRange(row, 6).setValue(data.instagram);
      if (data.linkedin !== undefined) sheet.getRange(row, 7).setValue(data.linkedin);
      if (data.tiktok !== undefined) sheet.getRange(row, 8).setValue(data.tiktok);
      return { success: true, message: 'Sosial media diperbarui' };
    }
  }
  
  return { success: false, message: 'User tidak ditemukan' };
}

// ---- ANONYMOUS MESSAGES ----

function handleSendAnonymousMessage(data) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AnonMessages');
  if (!sheet) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    sheet = ss.insertSheet('AnonMessages');
    sheet.appendRow(['id', 'text', 'senderName', 'timestamp', 'reactionsJSON']);
  }
  
  const id = Utilities.getUuid();
  const timestamp = new Date().toISOString();
  const senderName = data.senderName || 'Anonim';
  
  sheet.appendRow([id, data.text, senderName, timestamp, '{}']);
  
  return {
    success: true,
    message: {
      id: id,
      text: data.text,
      senderName: senderName,
      timestamp: timestamp,
      reactions: {}
    }
  };
}

function handleGetAnonymousMessages() {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AnonMessages');
  if (!sheet) return { success: true, messages: [] };
  
  const rows = sheet.getDataRange().getValues();
  const messages = [];
  
  for (let i = 1; i < rows.length; i++) {
    let reactions = {};
    try {
      reactions = JSON.parse(rows[i][4] || '{}');
    } catch (e) {
      reactions = {};
    }
    
    messages.push({
      id: rows[i][0],
      text: rows[i][1],
      senderName: rows[i][2] || 'Anonim',
      timestamp: rows[i][3],
      reactions: reactions
    });
  }
  
  return { success: true, messages: messages };
}

function handleReactAnonymousMessage(data) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('AnonMessages');
  if (!sheet) return { success: false, message: 'Sheet not found' };
  
  const rows = sheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.messageId) {
      let reactions = {};
      try {
        reactions = JSON.parse(rows[i][4] || '{}');
      } catch (e) {
        reactions = {};
      }
      
      const emoji = data.emoji;
      reactions[emoji] = (reactions[emoji] || 0) + 1;
      
      sheet.getRange(i + 1, 5).setValue(JSON.stringify(reactions));
      
      return { success: true, reactions: reactions };
    }
  }
  
  return { success: false, message: 'Message not found' };
}

// ---- OTP + PASSWORD SYSTEM ----

function handleSendOtp(data) {
  const phone = normalizePhone(data.phone);
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const userRows = userSheet.getDataRange().getValues();
  
  // Check if user exists
  let userExists = false;
  let userName = '';
  for (let i = 1; i < userRows.length; i++) {
    if (normalizePhone(userRows[i][0]) === phone) {
      userExists = true;
      userName = userRows[i][2] || '';
      break;
    }
  }
  
  // Generate 6-digit OTP
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  
  // Store OTP in OTPLogs sheet
  let otpSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('OTPLogs');
  if (!otpSheet) {
    otpSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('OTPLogs');
    otpSheet.appendRow(['phone', 'otp', 'expiresAt', 'attempts', 'createdAt']);
  }
  
  // Delete old OTPs for this phone
  const otpRows = otpSheet.getDataRange().getValues();
  for (let i = otpRows.length - 1; i >= 1; i--) {
    if (normalizePhone(otpRows[i][0]) === phone) {
      otpSheet.deleteRow(i + 1);
    }
  }
  
  // Save new OTP (expires in 5 minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();
  otpSheet.appendRow([phone, otp, expiresAt, 0, createdAt]);
  
  return {
    success: true,
    otp: otp,
    isNewUser: !userExists,
    userName: userName,
    message: 'OTP berhasil dikirim'
  };
}

function handleVerifyOtp(data) {
  const phone = normalizePhone(data.phone);
  const inputOtp = String(data.otp).trim();
  
  const otpSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('OTPLogs');
  if (!otpSheet) return { success: false, message: 'OTP tidak ditemukan' };
  
  const otpRows = otpSheet.getDataRange().getValues();
  
  for (let i = 1; i < otpRows.length; i++) {
    if (normalizePhone(otpRows[i][0]) === phone) {
      const storedOtp = String(otpRows[i][1]).trim();
      const expiresAt = new Date(otpRows[i][2]).getTime();
      let attempts = parseInt(otpRows[i][3]) || 0;
      
      // Check expiry
      if (Date.now() > expiresAt) {
        otpSheet.deleteRow(i + 1);
        return { success: false, message: 'OTP sudah expired' };
      }
      
      // Check max attempts (5)
      if (attempts >= 5) {
        otpSheet.deleteRow(i + 1);
        return { success: false, message: 'Terlalu banyak percobaan. Kirim ulang OTP.' };
      }
      
      // Verify OTP
      if (storedOtp === inputOtp) {
        // OTP correct — delete it
        otpSheet.deleteRow(i + 1);
        
        // Check if user has password
        const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
        const userRows = userSheet.getDataRange().getValues();
        let hasPassword = false;
        let userName = '';
        
        for (let j = 1; j < userRows.length; j++) {
          if (normalizePhone(userRows[j][0]) === phone) {
            hasPassword = Boolean(userRows[j][1]); // password column
            userName = userRows[j][2] || '';
            break;
          }
        }
        
        return { 
          success: true, 
          message: 'OTP valid',
          hasPassword: hasPassword,
          userName: userName
        };
      } else {
        // Wrong OTP — increment attempts
        otpSheet.getRange(i + 1, 4).setValue(attempts + 1);
        return { success: false, message: 'OTP salah' };
      }
    }
  }
  
  return { success: false, message: 'OTP tidak ditemukan' };
}

function handleLoginPassword(data) {
  const phone = normalizePhone(data.phone);
  const password = data.password;
  
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const rows = userSheet.getDataRange().getValues();
  
  for (let i = 1; i < rows.length; i++) {
    if (normalizePhone(rows[i][0]) === phone) {
      const storedPassword = rows[i][1] || '';
      
      if (!storedPassword) {
        return { success: false, message: 'Akun belum memiliki password. Silakan buat password baru.' };
      }
      
      if (storedPassword === password) {
        return {
          success: true,
          message: 'Login berhasil!',
          user: {
            phone: normalizePhone(rows[i][0]),
            name: rows[i][2],
            bio: rows[i][3] || '',
            photoUrl: rows[i][4] || ''
          }
        };
      } else {
        return { success: false, message: 'Password salah' };
      }
    }
  }
  
  return { success: false, message: 'User tidak ditemukan' };
}

function handleRegisterPassword(data) {
  const phone = normalizePhone(data.phone);
  const name = data.name;
  const password = data.password;
  
  if (!phone || !name || !password) {
    return { success: false, message: 'Data tidak lengkap' };
  }
  
  if (password.length < 6) {
    return { success: false, message: 'Password minimal 6 karakter' };
  }
  
  const userSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Users');
  const rows = userSheet.getDataRange().getValues();
  
  // Check if user already exists
  for (let i = 1; i < rows.length; i++) {
    if (normalizePhone(rows[i][0]) === phone) {
      // User exists — this is a migration (old user setting password)
      const row = i + 1;
      userSheet.getRange(row, 2).setValue(password); // Set password
      userSheet.getRange(row, 3).setValue(name);      // Update name
      
      return {
        success: true,
        message: 'Password berhasil dibuat!',
        user: {
          phone: phone,
          name: name,
          bio: rows[i][3] || '',
          photoUrl: rows[i][4] || ''
        }
      };
    }
  }
  
  // New user — create account
  userSheet.appendRow([phone, password, name, '', '', '', '', '']);
  
  return {
    success: true,
    message: 'Registrasi berhasil!',
    user: {
      phone: phone,
      name: name,
      bio: '',
      photoUrl: ''
    }
  };
}
