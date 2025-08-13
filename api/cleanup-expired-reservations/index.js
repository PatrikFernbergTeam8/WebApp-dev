const { GoogleAuth } = require('google-auth-library');

module.exports = async function (context, req) {
    const timeStamp = new Date().toISOString();
    
    context.log('JavaScript HTTP trigger function started at', timeStamp);

    // Simple authentication check - you can make this more secure
    const authKey = req.headers['x-auth-key'];
    if (authKey !== process.env.CLEANUP_AUTH_KEY) {
        context.res = {
            status: 401,
            body: 'Unauthorized'
        };
        return;
    }

    try {
        // Google Sheets configuration
        const SHEET_ID = '18dg0WlMsG0TzYfHNRqj1BnRWSryMDYAYAe1vW8ywoLM';
        const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
        
        // Fetch current data from Google Sheets
        const sheetsData = await fetchGoogleSheetsData(SHEET_ID, API_KEY);
        context.log(`Found ${sheetsData.length} rows to check`);
        
        // Process expired reservations
        const expiredCount = await cleanupExpiredReservations(sheetsData, SHEET_ID, API_KEY, context);
        
        context.log(`Cleanup completed. Removed ${expiredCount} expired reservations.`);
        
        context.res = {
            status: 200,
            body: {
                success: true,
                message: `Cleanup completed successfully. Removed ${expiredCount} expired reservations.`,
                timestamp: timeStamp,
                expiredCount: expiredCount
            }
        };
        
    } catch (error) {
        context.log.error('Error during cleanup:', error);
        
        context.res = {
            status: 500,
            body: {
                success: false,
                error: error.message,
                timestamp: timeStamp
            }
        };
    }

    context.log('JavaScript HTTP trigger function completed at', timeStamp);
};

/**
 * Fetch data from Google Sheets
 */
async function fetchGoogleSheetsData(sheetId, apiKey) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Lager!A:Z?key=${apiKey}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch Google Sheets data: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.values || data.values.length === 0) {
        return [];
    }
    
    const headers = data.values[0];
    const rows = data.values.slice(1);
    
    // Find Reserverad_av column index
    const reservedColumnIndex = headers.findIndex(header => header === 'Reserverad_av');
    
    return rows.map((row, index) => ({
        rowNumber: index + 2, // +2 because of header and 0-index
        reservedBy: row[reservedColumnIndex] || '',
        reservedColumnIndex: reservedColumnIndex,
        fullRow: row
    })).filter(row => row.reservedBy.trim() !== '');
}

/**
 * Clean up expired reservations
 */
async function cleanupExpiredReservations(data, sheetId, apiKey, context) {
    let expiredCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    for (const row of data) {
        const reservationInfo = parseReservationInfo(row.reservedBy);
        
        if (reservationInfo && reservationInfo.isExpired) {
            context.log(`Found expired reservation: Row ${row.rowNumber}, Reserved by ${reservationInfo.name}, Expired: ${reservationInfo.expiryDate}`);
            
            try {
                // Clear the reservation by updating the cell to empty
                await updateGoogleSheetCell(
                    sheetId,
                    row.rowNumber,
                    row.reservedColumnIndex,
                    '',
                    apiKey
                );
                
                expiredCount++;
                context.log(`✅ Cleared expired reservation for ${reservationInfo.name}`);
                
                // Add small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                context.log.error(`❌ Failed to clear reservation for row ${row.rowNumber}:`, error);
            }
        }
    }
    
    return expiredCount;
}

/**
 * Parse reservation info from text
 */
function parseReservationInfo(reservedBy) {
    if (!reservedBy) return null;
    
    const reservationMatch = reservedBy.match(/Reserverad av (.+?) till (\\d{4}-\\d{2}-\\d{2})/);
    if (reservationMatch) {
        const [, name, dateString] = reservationMatch;
        const expiryDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        
        const isExpired = expiryDate < today;
        
        return {
            name,
            expiryDate: dateString,
            isExpired,
            daysLeft: Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
        };
    }
    
    return null;
}

/**
 * Update a cell in Google Sheets
 */
async function updateGoogleSheetCell(sheetId, rowNumber, columnIndex, value, apiKey) {
    try {
        // Use Service Account authentication for write access
        const auth = new GoogleAuth({
            credentials: {
                type: 'service_account',
                project_id: process.env.GOOGLE_PROJECT_ID,
                private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\\\n/g, '\\n'),
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                client_id: process.env.GOOGLE_CLIENT_ID,
                auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                token_uri: 'https://oauth2.googleapis.com/token'
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const client = await auth.getClient();
        const accessToken = await client.getAccessToken();

        // Convert column index to letter (A=0, B=1, etc.)
        const columnLetter = String.fromCharCode(65 + columnIndex);
        const range = `Lager!${columnLetter}${rowNumber}`;
        
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=RAW`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${accessToken.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [[value]]
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update Google Sheet: ${response.status} - ${errorText}`);
        }
        
        return true;
    } catch (error) {
        throw new Error(`Error updating Google Sheet: ${error.message}`);
    }
}