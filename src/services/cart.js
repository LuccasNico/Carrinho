import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'enquirer';
import { listProducts } from './product.js';

const { Select, Input } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../database/StoreDB.db');
const db = new Database(dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS "CART" (
    "id_cart" INTEGER,
    "id_prod" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    PRIMARY KEY("id_cart" AUTOINCREMENT),
    UNIQUE("id_prod"),
    FOREIGN KEY("id_prod") REFERENCES PRODUCTS("id_prod")
)`);

function getProductById(id) {
    const stmt = db.prepare('SELECT * FROM PRODUCTS WHERE id_prod = ?');
    return stmt.get(id);
}

function addToCart(idProd, qty) {
    if (!Number.isInteger(idProd) || idProd <= 0) {
        throw new Error('Invalid product ID: must be a positive integer.');
    }
    if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error('Invalid quantity: must be a positive integer.');
    }

    const product = getProductById(idProd);
    if (!product) {
        throw new Error(`Product with ID ${idProd} not found.`);
    }

    const existing = db.prepare('SELECT qty FROM CART WHERE id_prod = ?').get(idProd);
    if (existing) {
        db.prepare('UPDATE CART SET qty = qty + ? WHERE id_prod = ?').run(qty, idProd);
    } else {
        db.prepare('INSERT INTO CART (id_prod, qty) VALUES (?, ?)').run(idProd, qty);
    }
}

function removeFromCart(idProd) {
    if (!Number.isInteger(idProd) || idProd <= 0) {
        throw new Error('Invalid product ID: must be a positive integer.');
    }
    const result = db.prepare('DELETE FROM CART WHERE id_prod = ?').run(idProd);
    if (result.changes === 0) {
        throw new Error(`Product with ID ${idProd} not in cart.`);
    }
}

function viewCart() {
    const rows = db.prepare(`
        SELECT c.id_prod, p.name_prod, p.price_prod, c.qty,
               (p.price_prod * c.qty) AS total
        FROM CART c
        JOIN PRODUCTS p ON p.id_prod = c.id_prod
        ORDER BY c.id_prod
    `).all();

    console.clear();
    if (rows.length === 0) {
        console.log('Cart is empty.');
        return;
    }

    console.log('ID | Name | Price | Qty | SubTotal');
    console.log('---|------|-------|-----|---------');
    let grandTotal = 0;
    for (const row of rows) {
        grandTotal += row.total;
        console.log(`${row.id_prod} | ${row.name_prod} | ${row.price_prod} | ${row.qty} | ${row.total}`);
    }
    console.log(`\nTotal: ${grandTotal}\n`);
}

async function menuCart() {
    while (true) {
        viewCart(); // Show cart contents before each action
        const prompt = new Select({
            message: 'Cart Menu:',
            choices: ['Add to Cart', 'Remove from Cart', 'Back']
        });
        
        const choice = await prompt.run();
        
        switch (choice) {
            case 'Add to Cart':
                listProducts();
                const productIdPrompt = new Input({ message: 'Enter product ID to add:' });
                const productIdRaw = await productIdPrompt.run();
                const productId = parseInt(productIdRaw, 10);
                
                const quantityPrompt = new Input({ message: 'Enter quantity:' });
                const quantityRaw = await quantityPrompt.run();
                const quantity = parseInt(quantityRaw, 10);
                
                try {
                    addToCart(productId, quantity);
                    console.log(`Added ${quantity} of product ${productId} to cart.`);
                } catch (error) {
                    console.log(`Error adding to cart: ${error.message}`);
                }
                break;
                
            case 'Remove from Cart':
                const removeIdPrompt = new Input({ message: 'Enter product ID to remove:' });
                const removeIdRaw = await removeIdPrompt.run();
                const removeId = parseInt(removeIdRaw, 10);
                
                try {
                    removeFromCart(removeId);
                    console.log(`Removed product ${removeId} from cart.`);
                } catch (error) {
                    console.log(`Error removing from cart: ${error.message}`);
                }
                break;
                
            case 'Back':
                console.clear();
                return;
        }
    }
}

export { menuCart };
