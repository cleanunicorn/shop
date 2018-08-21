pragma solidity ^0.4.24;

contract Shop {
    struct Product {
        string name;
        uint256 price;
        byte[] meta;
        address seller;
        bool enabled;
        uint256 dateOfCreation;
    }

    Product[] products;

    struct Receipt {
        address seller;
        address buyer;
        uint256 productID;
        uint256 quantity;
        uint256 dateOfPurchase;
    }

    Receipt[] receipts;

    function createProduct(
        string name, 
        uint256 price, 
        byte[] meta
    ) 
        public 
        returns (
            uint256 productID
        ) 
    {
        Product memory p;
        p.name = name;
        p.price = price;
        p.meta = meta;
        p.seller = msg.sender;
        p.enabled = true;
        p.dateOfCreation = now;

        products.push(p);

        emit ProductCreated(
            msg.sender,
            p.name,
            p.price,
            products.length - 1
        );

        return 0;
    }

    function getProduct(
        uint256 productID
    ) 
        public 
        view 
        returns (
            address seller,
            string name,
            uint256 price,
            byte[] meta,
            bool enabled,
            uint256 dateOfCreation
        ) 
    {
        Product memory p;
        p = products[productID];

        return(
            p.seller,
            p.name,
            p.price,
            p.meta,
            p.enabled,
            p.dateOfCreation
        );
    }

    function disableProduct(
        uint256 productID
    ) 
        public 
        onlySeller(productID)
        returns (
            bool success
        ) 
    {
        products[productID].enabled = false;

        return true;
    }

    function enableProduct(
        uint256 productID
    ) 
        public
        onlySeller(productID)
        returns (
            bool success
        ) 
    {
        products[productID].enabled = true;

        return true;    
    }

    function buy(
        uint256 productID,
        uint256 quantity
    ) 
        public
        payable
        returns (
            bool success,
            uint256 receiptID
        ) 
    {
        // Receipt memory r;
        // r.seller = products[productID].seller;
        // r.buyer = msg.sender;
        // r.productID = productID;
        // r.quantity = quantity;
        // r.dateOfPurchase = now;
        // receipts.push(r);

        emit Purchase(
            products[productID].seller,
            msg.sender,
            productID,
            quantity,
            now
        );

        return (true, 0);
    }


    modifier onlySeller(uint256 productID) {
        require(
            products[productID].seller == msg.sender, 
            "Only seller can disable products"
        );
        
        _;
    }

    event ProductCreated(
        address seller,
        string name,
        uint256 price,
        uint256 productID
    );

    event Purchase(
        address seller,
        address buyer,
        uint256 productID,
        uint256 quantity,
        uint256 dateOfPurchase
    );
}