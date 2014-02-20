onfigurations
```javascript
"modules": {
        "iap": {
                "sandbox": true or false,
                "sql": "mysql module configuration name",
                "googlePublicKeyPath": "path to google play public key files" // the file names MUST be specific (for live: iap-live, for sandbox: iap-sandbox)
        }
}
```

#####API: *validateApplePurchase*

<pre>
void validateApplePurchase(String receipt, Function cb)
</pre>
> Sends an HTTPS request to Apple to validate the given receipt and responds back an object { validateState: 'validated' or 'error', status: 'pending' or 'handled' or 'canceled' }

#####API: *validateGooglePurchase*

<pre>
void validateGooglePurchase(Object receipt, Function cb)
</pre>
> Validates the receipt with public key using open SSL

#####API: *updateStatus*

<pre>
void updateStatus(Mixed receipt, String status, Function cb)
</pre>
> Updates the status of the given receipt. the valid status are: pending, handled, canceled.

