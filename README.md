 <div align="center">

 # POS 📱

</div>

## Intro 

A prototype payment system, personalised point of sales terminal built in a simple monolithic architecture and fully written in node.js. Attempt to replicate modern payment process from authorisation, clearing and settlement basics.

## Stacks 

- NestJS
- PostgreSQL
- MongoDB
- Kafka

## Diagram 

![ image alt](https://github.com/andrewisoko/POS_terminal/blob/27b5cc236455cc3a24338349976ba750aedd09af/Architecture.pdf)

## Structure 

- main.ts contains the main endpoint which has been renamed with api gateway to represent its core routing usage. technical choice chosen for the sake of simplicity and avoiding over engineering.
- The config repository contains the app.service.ts which redirects the request to the transaction orchestra. file path: ...\POS\src\api_gateway\config\app.service.ts
- **Web Terminal**: the web terminal is a digital representation of the point of sales machine as mobile device camera to process card data (card as qr code), it follows basic procedures of real processing payment machines and generates a token when created.

    **IMPORTANT**
- The web terminal must be created to initiate the transactions as it contains the post request for the main endpoint of the app:

  ```ts
  const response = await firstValueFrom(
    this.httpService.post(
      'http://localhost:3002/api.gateway/',
      {
        pan: cardDetails.pan,
        amount: cardDetails.amount,
        currency: cardDetails.currency,
        expiry: cardDetails.expiry,
        merchant: cardDetails.merchant,
        timestamp: cardDetails.timestamp,
        customer: cardDetails.customer,
        account: cardDetails.account,
        terminal: terminal.id,
      },
      {
        headers: {
          Authorization: `Bearer ${terminal.acc_token}`,
        },
      },
    ),
  );

  return response.data;
  ```

- The token is attached to the authorisation header for the security layers of the services participating in the orchestra.

## Orchestra

- A coordinated, asynchronous sequence of requests from transaction service to the other services partaking in the payment processing once the card data successfully reaches the endpoint.
- Saga pattern to provide a robust fallback in case transaction fails.
- Encryption of sensitive data such as PAN and EXPIRY DATE.

### Acquirer service

- Once the Risk Engine approves the transaction, the Payment Gateway orchestrator forwards the authorization request to the Acquirer Bank Service.
- Fee calculation determines the interchange fee and any acquirer-specific markup. The merchant later receives the transaction amount minus these fees.
- Merchant net amount computes the net amount that will eventually be credited to the merchant's account, used for settlement, not authorization.
- Message formatting converts the internal REST/JSON request into the standard financial messaging format used by card networks, typically ISO 8583 or ISO 20022. This includes fields such as PAN, transaction amount and currency, MCC, and Terminal ID.
- The Acquirer opens a secure TCP session and sends the ISO 8583 authorization request.
- In ISO 8583, the MTI for an authorization request is typically `0100`.

```ts
acquirer.connect(5000, 'localhost', () => {
  const data = {
    0: '0200',
    2: rawPan,
    3: '000000',
    4: isoAmount,
    11: stanString,
    14: isoExpDate,
    41: acqData.terminalid.padEnd(8, ' '),
    43: acqData.merchant.padEnd(40, ' '),
    45: acqData.fullName,
    49: '826',
  };

  const iso = new iso8583(data);
  const isoBuffer = iso.getBufferMessage();

  if (isoBuffer.error) throw new Error(`ISO8583 encoding error: ${isoBuffer.error}`);

  const len = Buffer.alloc(2);
  len.writeUInt16BE(isoBuffer.length);

  const finalMessage = Buffer.concat([len, isoBuffer]);
  acquirer.write(finalMessage);
});

acquirer.on('data', (data) => {
  console.log('Response:', data.toString('hex'));
});
```

-  ***the Issuer Service***: After receiving the authorization request from the Acquirer via the Card Network—performs the core financial validation and recording within the issuing bank's domain. This step is entirely internal to the issuer and does not involve the Transaction Service (which remains waiting for a response).
-  Once the transaction is approved the event is published on kafka, ready to be consumed by the device app.

## Contract Injection

- The contract server sends the contract payload to http://localhost:3002/api.gateway/issuer-rules/contract (file path controller ...\POS\src\services\auth\banks\issuer_service\issuer_rules\issuer.rules.controller.ts)
- the contract conditions are stored in a globally scoped array which serves as a communication bridge between issuer rules and issuer service if contract exists.
  
- ...\POS\src\services\auth\banks\issuer_service\issuer_rules\issuer.rules.service.ts
```ts
export type { SetAgreements } from "../interfaces/set-agreements.interface";
	export const conditions: SetAgreements[] = [];
```
- ...\POS\src\services\auth\banks\issuer_service\issuer.service.ts
```ts

	       try {
                if ( conditions.length > 0 ){


                    let count = 0;
                    let splitAmount = 0;
                    let contractTransaction;
                    const setAgreements = conditions[0];  

                    
                        for( const contractAccountId of setAgreements.accounts ){
                            
                            const prevTransaction = await this.findTransaction(stan);
                            const targetAccount = await this.findTargetAccount(contractAccountId);
                            // this is only a part of the whole code snippet //
	}
}

```




