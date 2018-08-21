let Shop = artifacts.require("./Shop.sol");
let BigNumber = require('bignumber.js');

contract('Shop', (accounts) => {
    let owner = accounts[0];
    let seller = accounts[1];
    let buyer = accounts[2];
    let hacker = accounts[9];

    it("should assert true", async function () {
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
            assert.isTrue(productCreated.receipt.status == '0x1');
    
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

    it("should be able to enableProduct", async () => {
        let shop = await Shop.new({ from: owner });

        let tests = [
            {
                product: {
                    seller: seller,
                    name: "product1",
                    price: BigNumber(0),
                    meta: [],
                },
                enabler: seller,
                successful: true,
            },
            {
                product: {
                    seller: seller,
                    name: "product2",
                    price: BigNumber(0),
                    meta: [],
                },
                enabler: hacker,
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

            await shop.disableProduct(
                productCreated.logs[0].args.productID.toString(),
                { from: test.product.seller }
            );

            let productWasEnabled = false;

            try {
                let productEnabled = await shop.enableProduct(
                    productCreated.logs[0].args.productID.toString(),
                    { from: test.enabler }
                );

                productWasEnabled = true;
            } catch (e) { }
            
            if (productWasEnabled) {
                assert.isTrue(
                    test.successful,
                    `This account ${test.enabler} should not be allowed to enable the product`
                );
            } else {
                assert.isTrue(
                    !test.successful,
                    `This account ${test.enabler} should be allowed to enable the product`
                );
            }
        }
    });

    it("should be emit Purchase event on buy", async () => {
        let shop = await Shop.new({ from: owner });

        let tests = [
            // Buyer successfully buys 1 product
            {
                product: {
                    seller: seller,
                    name: "product1",
                    price: BigNumber(web3.toWei(1, "gwei")),
                    meta: [],
                },
                buyer: {
                    address: buyer,
                    value: BigNumber(web3.toWei(1, "gwei")),
                    quantity: 1,
                },
                successful: true,
            },
            // Buyer successfully buys 10 products
            {
                product: {
                    seller: seller,
                    name: "product2",
                    price: BigNumber(web3.toWei(1, "gwei")),
                    meta: [],
                },
                buyer: {
                    address: buyer,
                    value: BigNumber(web3.toWei(10, "gwei")),
                    quantity: 10,
                },
                successful: true,
            },
            // Buyer unsuccessfully buys 1 product (not enough ether sent)
            {
                product: {
                    seller: seller,
                    name: "product3",
                    price: BigNumber(web3.toWei(10, "gwei")),
                    meta: [],
                },
                buyer: {
                    address: buyer,
                    value: BigNumber(web3.toWei(1, "gwei")),
                    quantity: 1,
                },
                successful: false,
            },
        ];

        for (let i = 0; i < tests.length; i++) {
            let test = tests[i];

            let productCreated = await shop.createProduct(
                test.product.name,
                test.product.price.toString(),
                test.product.meta,
                {
                    from: test.product.seller,
                },
            );

            let productID = productCreated.logs[0].args.productID.toString();

            let productBought = await shop.buy(
                productID,
                test.buyer.quantity,
                {
                    from: test.buyer.address,
                },
            );

            if (test.successful) {
                assert.equal(
                    productBought.logs.length,
                    1,
                    "Expecting one event"
                );
            } else {
                assert.equal(
                    productBought.logs.length,
                    0,
                    "Expecting no event"
                );
            }

            let purchaseEvent = productBought.logs[0];

            let block = await web3.eth.getBlock("latest");
            let blockDate = block.timestamp;
            
            assert.equal(
                purchaseEvent.event,
                'Purchase',
                "Purchase event was not found",
            );

            assert.equal(
                purchaseEvent.args.seller,
                test.product.seller,
                `Emitted seller incorrect`,
            );

            assert.equal(
                purchaseEvent.args.buyer,
                test.buyer.address,
                `Emitted buyer incorrect`,
            );

            assert.equal(
                purchaseEvent.args.productID.toString(),
                productID,
                `Emitted productID incorrect`,
            );

            assert.equal(
                purchaseEvent.args.quantity,
                test.buyer.quantity,
                `Emitted quantity incorrect`,
            );

            assert.equal(
                purchaseEvent.args.dateOfPurchase.toString(),
                blockDate,
            );
        }
    });
});
