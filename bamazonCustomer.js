//Require mysql
var mysql = require("mysql");

//Require .env file
require("dotenv").config();

//Require inquirer
var inquirer = require('inquirer');

var connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  //credentials
  user: process.env.DB_USER,

  //select database
  password: process.env.DB_PASSWORD,
  database: "bamazon"
});

connection.connect(function(err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId + "\n");
  });

//get a list of the products inventory from the mysql database
function getProducts() {
  connection.query("SELECT * FROM products;", function(err, data) {
    if (err) throw err;
    
    console.log("Welcome to Bamazon! \nHere is a list of available products...\n");
   
    //display list of products 
    var getproducts = '';
    for (var i = 0; i < data.length; i++) {
        getproducts = '';
        getproducts += "ID: " + data[i].item_id + " || ";
        getproducts += "Product: " + data[i].product_name + " || "; 
        getproducts += "Department: " + data[i].department_name + " || ";
        getproducts += "Price: " + data[i].price + " || ";
        getproducts += "QTY: " + data[i].stock_quantity + '\n';

        console.log(getproducts);  
    }
    console.log("---------------------------------------------------------------------\n");

    //use prompt function to ask the users what id they want to purchase 
    promptUserPurchase();
  });
  
}

// validateInput makes sure that the user is supplying only positive integers for their inputs
function validateInput(value) {
	var integer = Number.isInteger(parseFloat(value));
	var sign = Math.sign(value);

	if (integer && (sign === 1)) {
		return true;
	} else {
		return 'Please enter a whole non-zero number.';
	}
}

// promptUserPurchase will prompt the user for the item/quantity they would like to purchase
function promptUserPurchase() {

	// Prompt the user to select an item
	inquirer.prompt([
		{
			type: 'input',
			name: 'item_id',
			message: 'Please enter the Item ID you would like to purchase: ',
			validate: validateInput,
			filter: Number
		},
		{
			type: 'input',
			name: 'quantity',
			message: 'How many do you need?',
			validate: validateInput,
			filter: Number
		}
	]).then(function(input) {
		// console.log('Customer has selected: \n    item_id = '  + input.item_id + '\n    quantity = ' + input.quantity);

		var item = input.item_id;
		var quantity = input.quantity;

		// Query db to confirm that the given item ID exists in the desired quantity
		var queryStr = 'SELECT * FROM products WHERE ?';

		connection.query(queryStr, {item_id: item}, function(err, data) {
			if (err) throw err;

			// If the user has selected an invalid item ID, data array will be empty
			if (data.length === 0) {
				console.log('ERROR: Invalid Item ID. Please enter a valid Item ID!');
				displayInventory();

			} else {
				var productData = data[0];

				// If the quantity requested by the user is in stock
				if (quantity <= productData.stock_quantity) {
					console.log('Congratulations!');

					// Construct the updating query string
					var updateQueryStr = 'UPDATE products SET stock_quantity = ' + (productData.stock_quantity - quantity) + ' WHERE item_id = ' + item;
					// console.log('updateQueryStr = ' + updateQueryStr);

					// Update the inventory
					connection.query(updateQueryStr, function(err, data) {
						if (err) throw err;

						console.log('Your order has been placed! The total is $' + productData.price * quantity + '.');
						console.log('Thank you for shopping with us!');
						console.log("\n---------------------------------------------------------------------\n");

						// End the database connection
						connection.end();
					})
				} else {
					console.log('Sorry, insufficient quantity! Please try again!');
					console.log('Please modify your order.');
					console.log("\n---------------------------------------------------------------------\n");

                    displayInventory();
				}
			}
		})
	})
}

// displayInventory will retrieve the current inventory from the database and output it to the console
function displayInventory() {
	// console.log('___ENTER displayInventory___');

	// Construct the db query string
	queryStr = 'SELECT * FROM products';

	// Make the db query
	connection.query(queryStr, function(err, data) {
		if (err) throw err;

		console.log('Existing Inventory: ');
		console.log('...................\n');

		var strOut = '';
		for (var i = 0; i < data.length; i++) {
			strOut = '';
			strOut += 'ID: ' + data[i].item_id + ' || ';
            strOut += 'Product: ' + data[i].product_name + ' || ';
            strOut += 'Department: ' + data[i].department_name + ' || ';
            strOut += 'Price: $' + data[i].price + ' || ';
            strOut += 'QTY: ' + data[i].stock_quantity + '\n';

			console.log(strOut);
		}

	  	console.log("---------------------------------------------------------------------\n");

	  	//Prompt the user for item/quantity they would like to purchase
	  	promptUserPurchase();
	})
}

// runBamazon will execute the main application logic
function runBamazon() {

	// Display the available inventory
	getProducts();
}

// Run the application logic
runBamazon();