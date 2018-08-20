let Shop = artifacts.require("./Shop.sol");
let BigNumber = require('bignumber.js');

contract('Shop', function (accounts) {
    let owner = accounts[0];
    let seller = accounts[1];
    let hacker = accounts[9];

    it("should assert true", async function() {
        let shop = await Shop.new();
        assert.isTrue(true);
    });

    it("should be able to create a product", async () => {
        let shop = await Shop.new({ from: owner });

        let tests = [
            {
                seller: seller,
                name: "product1",
                price: BigNumber(web3.toWei(2, "ether")),
                meta: ["a", "b"],
                productID: 0,
            },
            {
                seller: seller,
                name: "product2",
                price: BigNumber(web3.toWei(5, "gwei")),
                meta: ["a", "b"],
                productID: 1,
            },
        ]

        for (i = 0; i < tests.length; i++) {
            let test = tests[i];
            
            let productCreated = await shop.createProduct(
                test.name,
                test.price.toString(),
                test.meta,
                {
                    from: test.seller,
                },
            );
    
            // Tx was successful
            assert.isTrue(productCreated.receipt.status == "0x01", "Transaction was not successful");
    
            // Event was emitted correctly
            assert.equal(
                productCreated.logs[0].args.seller,
                test.seller,
                "Seller is not correctly emitted",
            );

            assert.equal(
                productCreated.logs[0].args.name,
                test.name,
                "Name is not correctly emitted",
            );

            assert.isTrue(
                test.price.isEqualTo(productCreated.logs[0].args.price),
                "Price is not correctly emitted",
            );

            assert.equal(
                productCreated.logs[0].args.productID,
                test.productID,
                "ProductID is not correctly emitted",
            );
        }
    });

    it("should be able to get a product", async () => {
        let shop = await Shop.new({ from: owner });

        let tests = [
            {
                seller: seller,
                name: "product1",
                price: BigNumber(web3.toWei(2, "ether")),
                meta: ['0x61'],
                productID: 0,
            },
            {
                seller: seller,
                name: "product2",
                price: BigNumber(web3.toWei(5, "gwei")),
                meta: ["0xff", "0xf0"],
                productID: 1,
            },
        ]

        for (i = 0; i < tests.length; i++) {
            let test = tests[i];

            let productCreated = await shop.createProduct(
                test.name,
                test.price.toString(),
                test.meta,
                {
                    from: test.seller,
                },
            );
            let block = await web3.eth.getBlock("latest");
            let dateOfCreation = block.timestamp;

            let product = await shop.getProduct(test.productID);
            
            assert.equal(
                product[0],
                test.seller,
                "Seller is not correct",
            );

            assert.equal(
                product[1],
                test.name,
                "Name is not correct",
            );

            assert.isTrue(
                test.price.isEqualTo(product[2]),
                "Prices is not correct",
            );

            assert.deepEqual(
                product[3],
                test.meta,
                "Meta is not correct",
            );

            assert.equal(
                product[4],
                true,
                "Product is not automatically enabled",
            );

            assert.equal(
                product[5].toString(),
                dateOfCreation,
                "Date of creation is not correct",
            )
        }
    });

    it("should be able to disableProduct", async () => {
        let shop = await Shop.new({ from: owner });

        let tests = [
            {
                product: {
                    seller: seller,
                    name: "product1",
                    price: BigNumber(web3.toWei(2, "ether")),
                    meta: ["a", "b"],
                },
                disabler: seller,
                successful: true,
            },   
            {
                product: {
                    seller: seller,
                    name: "product2",
                    price: BigNumber(web3.toWei(2, "ether")),
                    meta: ["a", "b"],
                },
                disabler: hacker,
                successful: false,
            },  
        ]

        for (i = 0; i < tests.length; i++) {
            let test = tests[i];

            let productCreated = await shop.createProduct(
                test.product.name,
                test.product.price.toString(),
                test.product.meta,
                {
                    from: test.product.seller,
                },
            );

            let productWasDisabled = false;

            try {
                let productDisabled = await shop.disableProduct(
                    productCreated.logs[0].args.productID.toString(),
                    { from: test.disabler }
                );

                productWasDisabled = true;
            } catch (e) {}

            if (productWasDisabled) {
                assert.isTrue(
                    test.successful,
                    "Transaction should fail"
                );
            } else {
                assert.isTrue(
                    !test.successful,
                    "Transaction should be successful"
                );
            }

        }
    });
});
