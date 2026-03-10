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
    console.log('\n\n'); // Linha em branco para melhor formatação
}
function addProduct(name,price){
    // Validação do name: deve ser string não vazia
    if (typeof name !== 'string' || name.trim() === '') {
        throw new Error('Invalid value for name: must be a non-empty string.');
    }
    name = name.trim();  // Remove espaços extras

    // Validação do price: deve ser número positivo
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

async function menuDatabase() {
    while (true) {
        const prompt = new Select({
            message: 'Database Menu:',
            choices: ['Add Product', 'Delete Product', 'List Products', 'Back']
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
                    console.log(`Erro ao adicionar produto: ${error.message}`);
                }
                break;
                
            case 'Delete Product':
                const deleteIdPrompt = new Input({ message: 'Enter product ID to delete:' });
                const deleteId = await deleteIdPrompt.run();
                
                deleteProductByID(deleteId);
                break;

            case 'Back':
                console.clear();
                return;
        }
    }
}

export {product, addProduct, deleteProductByID, menuDatabase};