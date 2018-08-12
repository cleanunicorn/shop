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

    function createProduct(
        string name, 
        uint256 price, 
        byte[] meta
    ) public returns (
        uint256 productID
    ) {
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
    ) public view returns (
        address seller,
        string name,
        uint256 price,
        byte[] meta,
        bool enabled,
        uint256 dateOfCreation
    ) {
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

    event ProductCreated(
        address seller,
        string name,
        uint256 price,
        uint256 productID
    );
}