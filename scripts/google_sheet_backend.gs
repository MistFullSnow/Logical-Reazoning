// --- COPY THIS INTO YOUR GOOGLE SHEET > EXTENSIONS > APPS SCRIPT ---
// 1. Rename the sheet tab to "Users"
// 2. Deploy as Web App -> Execute as: Me -> Who has access: Anyone

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    
    // Google Apps Script can sometimes receive data as JSON or parameter
    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": "No data" })).setMimeType(ContentService.MimeType.JSON);
    }

    var email = data.email;
    var stats = JSON.stringify(data.stats);
    var timestamp = new Date();

    if (!email) {
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": "No email provided" })).setMimeType(ContentService.MimeType.JSON);
    }

    // Check if user exists
    var users = sheet.getDataRange().getValues();
    var rowIndex = -1;
    
    // Assuming Column A is Email, Column B is Stats JSON, Column C is Last Updated
    for (var i = 1; i < users.length; i++) {
      if (users[i][0] === email) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      // New User
      sheet.appendRow([email, stats, timestamp]);
    } else {
      // Update User
      sheet.getRange(rowIndex, 2).setValue(stats);
      sheet.getRange(rowIndex, 3).setValue(timestamp);
    }

    return ContentService.createTextOutput(JSON.stringify({ "result": "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": e.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var email = e.parameter.email;
    if (!email) {
      return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": "No email param" })).setMimeType(ContentService.MimeType.JSON);
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Users");
    var users = sheet.getDataRange().getValues();
    
    var userData = null;

    for (var i = 1; i < users.length; i++) {
      if (users[i][0] === email) {
        try {
          userData = JSON.parse(users[i][1]);
        } catch (err) {
          userData = {};
        }
        break;
      }
    }

    var result = {
      result: userData ? "success" : "not_found",
      data: userData
    };

    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}