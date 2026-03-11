import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../database/StoreDB.db');
const db = new Database(dbPath)
db.exec(`CREATE TABLE IF NOT EXISTS "PRODUCTS" (
	"id_prod"	INTEGER,
	"name_prod"	TEXT,
	"price_prod"	REAL,
	PRIMARY KEY("id_prod" AUTOINCREMENT)
)`);

import pkg from 'enquirer';
const { Select, Input } = pkg;

class product{
    constructor(id,name,price){
        this.id = id;
        this.name = name;
        this.price = price;
    }
}

function listProducts(){
    const stmt = db.prepare('SELECT * FROM PRODUCTS');
    const products = stmt.all();

    console.clear();
    console.log('ID | Name | Price');
    console.log('---|------|-------');
    for (let prod of products) {
        console.log(`${prod.id_prod} | ${prod.name_prod} | ${prod.price_prod}`);
    }
    console.log('\n\n'); // Blank line for readability
}
function addProduct(name,price){
    // Name validation: must be a non-empty string
    if (typeof name !== 'string' || name.trim() === '') {
        throw new Error('Invalid value for name: must be a non-empty string.');
    }
    name = name.trim();  // Remove extra spaces

    // Price validation: must be a positive number
    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
        throw new Error('Invalid value for price: must be a positive number.');
    }

    const stmt = db.prepare('INSERT INTO PRODUCTS (name_prod, price_prod) VALUES (?, ?)');
    const result = stmt.run(name, price);
    return new product(result.lastInsertRowid, name, price);
}
function deleteProductByID(id){
    const stmt = db.prepare('DELETE FROM PRODUCTS WHERE id_prod = ?');
    const result = stmt.run(id);
    if (result.changes > 0) {
        console.log(`Product with ID ${id} has been deleted.`);
    } else {
        console.log(`Product with ID ${id} not found.`);
    }
}

function updateProduct(id, newName, newPrice){
    // ID validation: must be a positive integer
    if (!Number.isInteger(id) || id <= 0) {
        throw new Error('Invalid ID: must be a positive integer.');
    }

    // Name validation: must be a non-empty string
    if (typeof newName !== 'string' || newName.trim() === '') {
        throw new Error('Invalid product name: must be a non-empty string.');
    }
    newName = newName.trim();  // Remove extra spaces

    // Price validation: must be a positive number
    if (typeof newPrice !== 'number' || isNaN(newPrice) || newPrice <= 0) {
        throw new Error('Invalid product price: must be a positive number greater than 0.');
    }

    // Check if the product exists
    const checkStmt = db.prepare('SELECT id_prod FROM PRODUCTS WHERE id_prod = ?');
    if (!checkStmt.get(id)) {
        throw new Error(`Product with ID ${id} not found.`);
    }

    // Update
    const stmt = db.prepare('UPDATE PRODUCTS SET name_prod = ?, price_prod = ? WHERE id_prod = ?');
    const result = stmt.run(newName, newPrice, id);
    if (result.changes > 0) {
        console.log(`Product with ID ${id} updated.`);
        return new product(id, newName, newPrice);
    } else {
        throw new Error(`Failed to update product with ID ${id}.`);
    }
}

async function menuDatabase() {
    while (true) {
        const prompt = new Select({
            message: 'Database Menu:',
            choices: ['Add Product', 'Delete Product', 'Update Product', 'Back']
        });
        
        listProducts();
        
        const choice = await prompt.run();
        
        switch (choice) {
            case 'Add Product':
                const namePrompt = new Input({ message: 'Enter product name:' });
                const name = await namePrompt.run();
                
                const pricePrompt = new Input({ message: 'Enter product price:' });
                const price = parseFloat(await pricePrompt.run());
                
                try {
                    const newProduct = addProduct(name, price);
                    console.log(`Product added: ${JSON.stringify(newProduct)}`);
                } catch (error) {
                    console.log(`Error adding product: ${error.message}`);
                }
                break;
                
            case 'Delete Product':
                const deleteIdPrompt = new Input({ message: 'Enter product ID to delete:' });
                const deleteId = await deleteIdPrompt.run();
                
                deleteProductByID(deleteId);
                break;
            
            case 'Update Product':
                const updateIdPrompt = new Input({ message: 'Enter product ID to update:' });
                const updateIdRaw = await updateIdPrompt.run();
                const updateId = parseInt(updateIdRaw, 10);
                if (Number.isNaN(updateId) || updateId <= 0) {
                    console.log('Invalid ID: must be a positive integer.');
                    break;
                }
                
                const updateNamePrompt = new Input({ message: 'Enter new product name:' });
                const updateName = (await updateNamePrompt.run()).trim();
                if (!updateName) {
                    console.log('Invalid name: must be a non-empty string.');
                    break;
                }
                
                const updatePricePrompt = new Input({ message: 'Enter new product price:' });
                const updatePriceRaw = await updatePricePrompt.run();
                const updatePrice = parseFloat(updatePriceRaw);
                if (Number.isNaN(updatePrice) || updatePrice <= 0) {
                    console.log('Invalid price: must be a positive number greater than 0.');
                    break;
                }
                
                try {
                    const updatedProduct = updateProduct(updateId, updateName, updatePrice);
                    console.log(`Product updated: ${JSON.stringify(updatedProduct)}`);
                } catch (error) {
                    console.log(`Error updating product: ${error.message}`);
                }
                break;

            case 'Back':
                console.clear();
                return;
        }
    }
}

export {product, addProduct, deleteProductByID, updateProduct, menuDatabase};
