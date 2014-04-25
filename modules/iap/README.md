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

Example:
```javascript
// example code with iap module
gracenode.iap.validateApplePurchase(receipt, function (error, response) {
        if (error) {
                // handle error here
        }

        // check the validated state
        if (response.validateState === 'validated') {
                // Apple has validated the purchase

                var hc = gracenode.wallet.create('hc');
                hc.addPaid(receipt, userId, itemPrice, itemValue,

                        // this callback will be called BEFORE the commit of "addPaid"
                        function (continueCallback) {

                                // update iap status to mark the receipt as "handled"
                                gracenode.iap.updateStatus(receipt, 'handled', function (error) {
                                        if (error) {
                                                // error on updating the status to "handled"
                                                return continueCallback(error); // this will make "addPaid" to auto-rollback
                                        }

                                        // iap receipt status updated to "handled" now commit
                                        continueCallback();

                                })

                        },

                        // this callback is to finalize "addPaid" transaction
                        function (error) {
                                if (error) {
                                        // error on finalizing the transaction
                                }

                                // we are done!
                        }

                );

        }

});
```
