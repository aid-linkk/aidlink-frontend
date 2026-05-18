# API Documentation

This document describes the API routes and endpoints available in the AidLink application.

## Overview

The AidLink frontend uses Next.js API routes for server-side operations. All API routes are located in `src/app/api/`.

## Authentication

### POST /api/auth/connect

Connect a wallet to the application.

**Request:**
```json
{
  "walletType": "freighter" | "rabet" | "xbull",
  "network": "testnet" | "mainnet"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7",
    "publicKey": "GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7",
    "network": "testnet"
  }
}
```

### POST /api/auth/disconnect

Disconnect the current wallet.

**Response:**
```json
{
  "success": true
}
```

## Campaigns

### GET /api/campaigns

Get a list of all campaigns.

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 10)
- `category`: string (optional)
- `status`: string (optional)
- `search`: string (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "1",
        "title": "Emergency Relief for Flood Victims",
        "description": "Providing immediate relief...",
        "targetAmount": 50000,
        "raisedAmount": 35000,
        "status": "active",
        "category": "emergency",
        "ngoName": "Red Cross International",
        "createdAt": "2026-05-01T00:00:00Z",
        "endDate": "2026-06-30T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

### GET /api/campaigns/[id]

Get details of a specific campaign.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "Emergency Relief for Flood Victims",
    "description": "Providing immediate relief...",
    "targetAmount": 50000,
    "raisedAmount": 35000,
    "status": "active",
    "category": "emergency",
    "ngoName": "Red Cross International",
    "ngoId": "ngo-1",
    "createdAt": "2026-05-01T00:00:00Z",
    "endDate": "2026-06-30T00:00:00Z",
    "location": {
      "country": "Bangladesh",
      "region": "Sylhet Division",
      "city": "Sylhet"
    },
    "beneficiaries": [
      {
        "id": "1",
        "name": "Family A",
        "status": "verified",
        "allocatedAmount": 500
      }
    ],
    "donations": [
      {
        "id": "1",
        "donor": "0x1234...5678",
        "amount": 500,
        "timestamp": "2026-05-18T12:00:00Z"
      }
    ]
  }
}
```

### POST /api/campaigns

Create a new campaign.

**Request:**
```json
{
  "title": "Emergency Relief for Flood Victims",
  "description": "Providing immediate relief...",
  "targetAmount": 50000,
  "category": "emergency",
  "endDate": "2026-06-30T00:00:00Z",
  "location": {
    "country": "Bangladesh",
    "region": "Sylhet Division",
    "city": "Sylhet"
  },
  "imageUrl": "https://example.com/image.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "contractId": "CONTRACT_ID",
    "status": "active"
  }
}
```

### POST /api/campaigns/[id]/donate

Donate to a campaign.

**Request:**
```json
{
  "amount": 500,
  "donorAddress": "GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7",
  "anonymous": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "TX_ID",
    "status": "pending"
  }
}
```

## Beneficiaries

### GET /api/beneficiaries

Get a list of beneficiaries.

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 10)
- `status`: string (optional)
- `campaignId`: string (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "beneficiaries": [
      {
        "id": "1",
        "name": "John Doe",
        "walletAddress": "GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7",
        "status": "verified",
        "campaignId": "1",
        "allocatedAmount": 500,
        "claimedAmount": 0,
        "location": {
          "country": "Bangladesh",
          "region": "Sylhet Division",
          "city": "Sylhet"
        },
        "createdAt": "2026-05-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### POST /api/beneficiaries/[id]/claim

Claim allocated aid.

**Request:**
```json
{
  "walletAddress": "GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "TX_ID",
    "amount": 500,
    "status": "pending"
  }
}
```

## Admin

### GET /api/admin/beneficiaries/pending

Get pending beneficiary verifications.

**Response:**
```json
{
  "success": true,
  "data": {
    "beneficiaries": [
      {
        "id": "1",
        "name": "John Doe",
        "walletAddress": "GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7",
        "status": "pending",
        "submittedAt": "2026-05-18T00:00:00Z",
        "documents": 3
      }
    ]
  }
}
```

### POST /api/admin/beneficiaries/[id]/verify

Verify a beneficiary.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "verified",
    "verifiedAt": "2026-05-18T12:00:00Z"
  }
}
```

### POST /api/admin/users/[id]/suspend

Suspend a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "suspended",
    "suspendedAt": "2026-05-18T12:00:00Z"
  }
}
```

## Analytics

### GET /api/analytics/dashboard

Get dashboard analytics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalDonations": 2500000,
    "totalCampaigns": 150,
    "totalBeneficiaries": 50000,
    "activeCampaigns": 45,
    "distributionRate": 85,
    "monthlyDonations": [
      {
        "month": "2026-01",
        "amount": 200000
      },
      {
        "month": "2026-02",
        "amount": 250000
      }
    ],
    "categoryDistribution": [
      {
        "category": "emergency",
        "amount": 1000000
      },
      {
        "category": "healthcare",
        "amount": 500000
      }
    ]
  }
}
```

## Transactions

### GET /api/transactions

Get transaction history.

**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 10)
- `type`: string (optional)
- `address`: string (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "1",
        "type": "donation",
        "from": "GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7",
        "to": "CONTRACT_ID",
        "amount": 500,
        "currency": "XLM",
        "campaignId": "1",
        "status": "completed",
        "timestamp": "2026-05-18T12:00:00Z",
        "txHash": "TX_HASH"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

### GET /api/transactions/[id]

Get transaction details.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1",
    "type": "donation",
    "from": "GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7",
    "to": "CONTRACT_ID",
    "amount": 500,
    "currency": "XLM",
    "campaignId": "1",
    "status": "completed",
    "timestamp": "2026-05-18T12:00:00Z",
    "txHash": "TX_HASH",
    "details": {
      "fee": 0.01,
      "memo": "Donation to campaign 1"
    }
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details"
  }
}
```

### Common Error Codes

- `AUTH_REQUIRED`: Authentication required
- `INVALID_INPUT`: Invalid input data
- `NOT_FOUND`: Resource not found
- `INSUFFICIENT_FUNDS`: Insufficient funds
- `TRANSACTION_FAILED`: Transaction failed
- `RATE_LIMITED`: Rate limit exceeded
- `SERVER_ERROR`: Internal server error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- Public endpoints: 100 requests per minute
- Authenticated endpoints: 1000 requests per minute
- Admin endpoints: 500 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620000000
```

## Webhooks

### POST /api/webhooks/stellar

Handle Stellar blockchain events.

**Request:**
```json
{
  "event": "transaction",
  "data": {
    "txHash": "TX_HASH",
    "type": "donation",
    "amount": 500,
    "from": "GB5XWAMU7QNOZBU4K7L5KGK46XB5HQDJC7W3COSKZQD5NVD4M7Y4Q2K7"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

## SDK Integration

The frontend uses the Soroban SDK for direct blockchain interactions:

```typescript
import { sorobanSDK } from '@/lib/soroban/sdk'

// Get account balance
const balance = await sorobanSDK.getBalance(accountId)

// Invoke contract
const result = await sorobanSDK.invokeContract(
  contractId,
  'donate',
  [amount]
)

// Submit transaction
const txHash = await sorobanSDK.submitTransaction(transaction)

// Get transaction status
const status = await sorobanSDK.getTransactionStatus(txHash)
```

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_AID_TOKEN_CONTRACT=your_contract_id
NEXT_PUBLIC_CAMPAIGN_MANAGER_CONTRACT=your_contract_id
NEXT_PUBLIC_BENEFICIARY_REGISTRY_CONTRACT=your_contract_id
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Security

- All API routes use CORS protection
- Rate limiting is implemented
- Input validation is performed on all endpoints
- Sensitive data is never logged
- Transactions are verified before processing
