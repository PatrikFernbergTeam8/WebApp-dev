// Google Sheets API service
import React, { useState, useEffect } from 'react';

const SHEET_ID = '18dg0WlMsG0TzYfHNRqj1BnRWSryMDYAYAe1vW8ywoLM';
const GID = '1760566905';

// Google Sheets API key - Add your API key here
const API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY || 'AIzaSyAn00Si9mmRHinc4En7bmEw_7O-RobMUw8';

// Debug log to check if API key is loaded
console.log('🔑 API Key loaded:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NO API KEY');

// Google Sheets API v4 endpoint for private sheets
// We need to specify the sheet name or use the range format
const SHEETS_API_V4_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/A:Z?key=${API_KEY}`;
const SHEETS_API_V4_URL_WITH_RANGE = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A:Z?key=${API_KEY}`;
const SHEETS_API_V4_URL_LAGER = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Lager!A:Z?key=${API_KEY}`;

// Public Google Sheets API endpoint (no API key needed for public sheets)
const SHEETS_API_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

// Alternative JSON endpoint if the sheet is published to web
const SHEETS_JSON_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${GID}`;

/**
 * Parse CSV data to array of objects
 */
function parseCSVToObjects(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',').map(value => value.trim().replace(/"/g, ''));
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      data.push(obj);
    }
  }
  
  return data;
}

/**
 * Parse Google Sheets JSON response
 */
function parseGoogleSheetsJSON(response) {
  // Remove the callback wrapper and parse JSON
  const jsonString = response.substring(47).slice(0, -2);
  const data = JSON.parse(jsonString);
  
  if (!data.table || !data.table.rows) {
    return [];
  }
  
  const headers = data.table.cols.map(col => col.label || col.id);
  const rows = data.table.rows;
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      const cell = row.c[index];
      obj[header] = cell ? (cell.v || cell.f || '') : '';
    });
    return obj;
  });
}

/**
 * Parse Google Sheets API v4 response
 */
function parseGoogleSheetsAPIv4(data) {
  if (!data.values || data.values.length === 0) {
    return [];
  }
  
  const headers = data.values[0]; // First row contains headers
  const rows = data.values.slice(1); // Rest are data rows
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || '';
    });
    return obj;
  });
}

/**
 * Transform Google Sheets data to our printer format
 */
function transformToPrinterData(rawData) {
  console.log('🔄 Transforming raw data:', rawData);
  
  // Transform your Google Sheets data to printer format
  return rawData.map((row, index) => {
    console.log(`Row ${index}:`, row);
    
    // Skip empty rows - check if we have brand or model
    const brand = row['Märke'] || '';
    const model = row['Modell'] || '';
    
    if (!brand && !model) return null;
    
    // Map rekond status to our status format
    const rekondStatus = (row['Rekond'] || '').toLowerCase();
    let status = 'available';
    if (rekondStatus.includes('levererad')) status = 'delivered';
    if (rekondStatus.includes('inväntar')) status = 'pending';
    if (rekondStatus.includes('ej')) status = 'cancelled';
    
    // Determine type based on model
    const fullModel = `${brand} ${model}`.trim();
    let type = 'Skrivare';
    if (fullModel.includes('WF-')) type = 'Bläckstråleskrivare';
    if (fullModel.includes('IM') || fullModel.includes('MP') || fullModel.includes('Bizhub')) type = 'Multifunktion';
    if (fullModel.includes('Touchpanel')) type = 'Touchpanel';
    
    const result = {
      brand: brand || 'Unknown',
      model: model || 'Unknown',
      type: type,
      status: status,
      location: row['Senaste kunden'] || 'Okänd',
      quantity: 1,
      price: row['Värde'] || 'Se avtal',
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    
    console.log(`Transformed row ${index}:`, result);
    return result;
  }).filter(Boolean); // Remove null entries
}

/**
 * Fetch printer data from Google Sheets
 */
export async function fetchPrintersFromGoogleSheets() {
  try {
    // First try Google Sheets API v4 (for private sheets with API key)
    if (API_KEY && API_KEY !== 'YOUR_API_KEY_HERE') {
      try {
        // Use only the "Lager" sheet
        console.log('🔍 Fetching data from Lager sheet:', SHEETS_API_V4_URL_LAGER);
        const response = await fetch(SHEETS_API_V4_URL_LAGER);
        
        if (response.ok) {
          const data = await response.json();
          const rawData = parseGoogleSheetsAPIv4(data);
          console.log('✅ Successfully fetched data from Lager sheet');
          console.log('📊 Raw data preview:', rawData.slice(0, 3));
          
          // Only return data if we have meaningful content
          if (rawData.length > 0) {
            return transformToPrinterData(rawData);
          }
        } else {
          console.log('❌ Failed to fetch from Lager sheet, Status:', response.status);
        }
      } catch (apiError) {
        console.log('❌ API v4 error:', apiError.message);
      }
    } else {
      console.log('No valid API key, skipping API v4');
    }
    
    // Fallback to public JSON endpoint
    try {
      console.log('Trying public JSON endpoint...');
      console.log('JSON URL:', SHEETS_JSON_URL);
      const response = await fetch(SHEETS_JSON_URL);
      
      console.log('JSON response status:', response.status);
      console.log('JSON response ok:', response.ok);
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('JSON response text:', responseText.substring(0, 200) + '...');
        const rawData = parseGoogleSheetsJSON(responseText);
        console.log('JSON parsed data:', rawData);
        console.log('Successfully fetched data via JSON endpoint');
        return transformToPrinterData(rawData);
      } else {
        const errorText = await response.text();
        console.log('JSON error response:', errorText);
      }
    } catch (jsonError) {
      console.log('JSON endpoint error:', jsonError.message);
    }
    
    // Final fallback to CSV format
    try {
      console.log('Trying CSV endpoint...');
      console.log('CSV URL:', SHEETS_API_URL);
      const csvResponse = await fetch(SHEETS_API_URL);
      
      console.log('CSV response status:', csvResponse.status);
      console.log('CSV response ok:', csvResponse.ok);
      
      if (csvResponse.ok) {
        const csvText = await csvResponse.text();
        console.log('CSV response text:', csvText.substring(0, 200) + '...');
        const rawData = parseCSVToObjects(csvText);
        console.log('CSV parsed data:', rawData);
        console.log('Successfully fetched data via CSV endpoint');
        return transformToPrinterData(rawData);
      } else {
        const errorText = await csvResponse.text();
        console.log('CSV error response:', errorText);
      }
    } catch (csvError) {
      console.log('CSV endpoint error:', csvError.message);
    }
    
    throw new Error('All API methods failed');
    
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    
    // Return fallback data if API fails
    return [
      {
        id: "ERROR",
        brand: "API Error",
        model: "Could not fetch data",
        type: "Error",
        status: "out_of_stock",
        location: "N/A",
        quantity: 0,
        price: "N/A",
        lastUpdated: new Date().toISOString().split('T')[0],
      }
    ];
  }
}

/**
 * Hook for using Google Sheets data in React components
 */
export function useGoogleSheetsData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = async () => {
    try {
      console.log('🔄 Fetching data from Google Sheets...');
      setLoading(true);
      setError(null);
      const printersData = await fetchPrintersFromGoogleSheets();
      console.log('📊 Fetched data:', printersData);
      setData(printersData);
    } catch (err) {
      console.error('❌ Error in useGoogleSheetsData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on mount
  useEffect(() => {
    console.log('🚀 useGoogleSheetsData mounted, fetching initial data...');
    fetchData();
  }, []);
  
  // Refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  return { data, loading, error, refetch: fetchData };
}

export default fetchPrintersFromGoogleSheets;