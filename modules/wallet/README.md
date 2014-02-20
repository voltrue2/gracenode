Configurations
```javascript
"modules": {
        "names": [an array of wallet names],
        "sql": "mysql configuration name"
}
```

#####API: *create*

<pre>
Wallet create(String walletName)
</pre>
> Returns an instance of Wallet class by a wallet name
>> The wallet name needs to be defined in the configuration file

##### Wallet class

> **getBalanceByUserId**
<pre>
void getBalanceByUserId(String uniqueUserId, Function callback)
</pre>
> Rerturns the current balance of a wallet in the callback as a second argument

> **addPaid**
<pre>
void addPaid(String uniqueReceiptHash, String uniqueUserId, Int price, Int value, Function onCallback<optional>, Function callback)
</pre>
> Adds the value to a wallet as "paid"
>> "paid" represents that the user has paid real money

>> If onCallback is given: the function will be called BEFORE committing the "add" transaction, if an error occuries in onCallback, the transaction can be rolled back

> **addFree**
<pre>
void addFree(String uniqueReceiptHash, String uniqueUserId, Int value, Function onCallback<optional>, Function callback)
</pre>
> Adds the value to a wallet as "free"
>> "free" represents that the user has been given the value as free gift

>> If onCallback is given: the function will be called BEFORE committing the "add" transaction, if an error occuries in onCallback, the transaction can be rolled back

mple:
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

> **spend**
<pre>
void spend(String uniqueUserId, Int value, String spendFor, Function onCallback, Function callback)
</pre>
> Spends value from a wallet if allowed
>> spendFor should represent what the user has spend the value for

>> If onCallback is given: the function will be called BEFORE committing the "spend" transaction, if an error occuries in onCallback, the transaction can be rolled back

Example:
```javascript
// example of how to use wallet.spend
var itemToBePurchased = 'test.item.1000';
var cost = 1000; // this is the amount that will be taken out of wallet 'hc'
var hc = gracenode.wallet.create('hc');
hc.spend(userId, cost, itemIdToBePurchase,

        // this callback will be called BEFORE the commit of "spend"
        function (continueCallback) {

                // give the user what the user is spending value for
                user.giveItemByUserId(userId, itemToBePurchased, function (error) {
                        if (error) {
                                // failed to give the user the item
                                return continueCallback(error); // rollback
                        }

                        // succuessfully gave the user the item
                        continueCallback();

                });
        },

        // this callback is to finalize "spend" transaction
        function (error) {
                if (error) {
                        // error on finalizing the transaction
                }

                // we are done!
        }

);

```

