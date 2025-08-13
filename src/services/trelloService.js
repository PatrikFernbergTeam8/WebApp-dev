// Trello API service
import React, { useState, useEffect } from 'react';

// Trello API credentials
const API_KEY = import.meta.env.VITE_TRELLO_API_KEY;
const TOKEN = import.meta.env.VITE_TRELLO_TOKEN;
const BOARD_ID = '5vaVervN'; // Extracted from URL

// Trello API base URL
const TRELLO_API_BASE = 'https://api.trello.com/1';

/**
 * Fetch board information including lists
 */
export async function fetchTrelloBoard() {
  try {
    const url = `${TRELLO_API_BASE}/boards/${BOARD_ID}?key=${API_KEY}&token=${TOKEN}&lists=open&cards=open&card_customFieldItems=true`;
    
    console.log('🔍 Fetching Trello board data...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Trello API error: ${response.status}`);
    }
    
    const boardData = await response.json();
    console.log('✅ Successfully fetched Trello board data:', boardData);
    
    return boardData;
  } catch (error) {
    console.error('❌ Error fetching Trello board:', error);
    throw error;
  }
}

/**
 * Fetch all cards from the board with detailed information
 */
export async function fetchTrelloCards() {
  try {
    const url = `${TRELLO_API_BASE}/boards/${BOARD_ID}/cards?key=${API_KEY}&token=${TOKEN}&customFieldItems=true&members=true&list=true&attachments=true`;
    
    console.log('🔍 Fetching Trello cards...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Trello API error: ${response.status}`);
    }
    
    const cards = await response.json();
    console.log('✅ Successfully fetched Trello cards:', cards);
    
    return cards;
  } catch (error) {
    console.error('❌ Error fetching Trello cards:', error);
    throw error;
  }
}

/**
 * Fetch board lists to get list names and IDs
 */
export async function fetchTrelloLists() {
  try {
    const url = `${TRELLO_API_BASE}/boards/${BOARD_ID}/lists?key=${API_KEY}&token=${TOKEN}`;
    
    console.log('🔍 Fetching Trello lists...');
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Trello API error: ${response.status}`);
    }
    
    const lists = await response.json();
    console.log('✅ Successfully fetched Trello lists:', lists);
    
    return lists;
  } catch (error) {
    console.error('❌ Error fetching Trello lists:', error);
    throw error;
  }
}

/**
 * Transform Trello cards to delivery format
 */
export function transformTrelloToDeliveries(cards, lists) {
  if (!cards || !lists) return [];
  
  // Create a lookup map for list names
  const listMap = {};
  lists.forEach(list => {
    listMap[list.id] = list.name;
  });
  
  return cards.map((card, index) => {
    // Extract basic info
    const customer = card.name || 'Okänd kund';
    const description = card.desc || '';
    const listName = listMap[card.idList] || 'Okänd status';
    
    // Extract labels for status
    const labels = card.labels || [];
    const statusLabel = labels.find(label => 
      ['nybeställning', 'beställd', 'begagnad', 'bokat&klart'].includes(label.name.toLowerCase())
    );
    const status = statusLabel ? statusLabel.name : 'Okänd';
    
    // Extract model from description or card name
    let model = '';
    const modelMatch = description.match(/modell[:\s]*(.*?)(?:\n|$)/i) || 
                     description.match(/(epson|ricoh|canon|hp|brother)[\s\w-]*/i);
    if (modelMatch) {
      model = modelMatch[1] || modelMatch[0];
    }
    
    // Extract address from description
    let address = '';
    const addressMatch = description.match(/(?:leveransadress|adress)[:\s]*(.*?)(?:\n|$)/i) ||
                        description.match(/[A-ZÅÄÖ][a-zåäöA-Z\s]+\s\d+/);
    if (addressMatch) {
      address = addressMatch[1] || addressMatch[0];
    }
    
    // Extract seller from description or members
    let seller = '';
    const sellerMatch = description.match(/(?:säljare|ansvarig)[:\s]*(.*?)(?:\n|$)/i);
    if (sellerMatch) {
      seller = sellerMatch[1];
    } else if (card.members && card.members.length > 0) {
      seller = card.members[0].fullName;
    }
    
    // Extract contact info from description
    let email = '';
    let phone = '';
    const emailMatch = description.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const phoneMatch = description.match(/(?:tel|telefon)[:\s]*([+\d\s-]+)/i) ||
                      description.match(/\b\d{2,4}[-\s]?\d{6,8}\b/);
    
    if (emailMatch) email = emailMatch[0];
    if (phoneMatch) phone = phoneMatch[1] || phoneMatch[0];
    
    // Extract date from description or due date
    let desiredDate = '';
    if (card.due) {
      desiredDate = new Date(card.due).toLocaleDateString('sv-SE');
    } else {
      const dateMatch = description.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\s\w+)/);
      if (dateMatch) {
        desiredDate = dateMatch[0];
      }
    }
    
    return {
      id: card.id,
      customer: customer,
      company: customer, // Same as customer for now
      model: model.trim(),
      address: address.trim(),
      status: status,
      priority: labels.length > 0 ? labels[0].name : '',
      desiredDate: desiredDate,
      seller: seller.trim(),
      email: email.trim(),
      phone: phone.trim(),
      description: description.substring(0, 200) + (description.length > 200 ? '...' : ''),
      listName: listName,
      trelloUrl: card.shortUrl,
      lastActivity: card.dateLastActivity
    };
  }).filter(delivery => delivery.customer !== 'Okänd kund'); // Filter out cards without proper names
}

/**
 * Hook for using Trello data in React components
 */
export function useTrelloData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchData = async () => {
    try {
      console.log('🔄 Fetching data from Trello...');
      setLoading(true);
      setError(null);
      
      // Fetch cards and lists in parallel
      const [cards, lists] = await Promise.all([
        fetchTrelloCards(),
        fetchTrelloLists()
      ]);
      
      // Transform to our format
      const deliveries = transformTrelloToDeliveries(cards, lists);
      console.log('📊 Transformed deliveries:', deliveries);
      
      setData(deliveries);
    } catch (err) {
      console.error('❌ Error in useTrelloData:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch data on mount
  useEffect(() => {
    console.log('🚀 useTrelloData mounted, fetching initial data...');
    fetchData();
  }, []);
  
  // Refresh data every 10 minutes
  useEffect(() => {
    const interval = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  return { data, loading, error, refetch: fetchData };
}

export default {
  fetchTrelloBoard,
  fetchTrelloCards,
  fetchTrelloLists,
  transformTrelloToDeliveries,
  useTrelloData
};