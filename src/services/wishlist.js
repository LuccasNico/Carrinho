import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'enquirer';
import { listProducts } from './product.js';
import { addToCart } from './cart.js';

const { Select, Input } = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../database/StoreDB.db');
const db = new Database(dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS "WISHLIST" (
    "id_wishlist" INTEGER,
    "id_prod" INTEGER NOT NULL,
    "qty" INTEGER NOT NULL,
    PRIMARY KEY("id_wishlist" AUTOINCREMENT),
    UNIQUE("id_prod"),
    FOREIGN KEY("id_prod") REFERENCES PRODUCTS("id_prod")
)`);

function getProductById(id) {
    const stmt = db.prepare('SELECT * FROM PRODUCTS WHERE id_prod = ?');
    return stmt.get(id);
}

function addToWishlist(idProd, qty) {
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

    const existing = db.prepare('SELECT qty FROM WISHLIST WHERE id_prod = ?').get(idProd);
    if (existing) {
        db.prepare('UPDATE WISHLIST SET qty = qty + ? WHERE id_prod = ?').run(qty, idProd);
    } else {
        db.prepare('INSERT INTO WISHLIST (id_prod, qty) VALUES (?, ?)').run(idProd, qty);
    }
}

function removeFromWishlist(idProd) {
    if (!Number.isInteger(idProd) || idProd <= 0) {
        throw new Error('Invalid product ID: must be a positive integer.');
    }
    const result = db.prepare('DELETE FROM WISHLIST WHERE id_prod = ?').run(idProd);
    if (result.changes === 0) {
        throw new Error(`Product with ID ${idProd} not in wishlist.`);
    }
}

function viewWishlist() {
    const rows = db.prepare(`
        SELECT w.id_prod, p.name_prod, p.price_prod, w.qty,
               (p.price_prod * w.qty) AS total
        FROM WISHLIST w
        JOIN PRODUCTS p ON p.id_prod = w.id_prod
        ORDER BY w.id_prod
    `).all();

    console.clear();
    if (rows.length === 0) {
        console.log('Wishlist is empty.');
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

function buyWishlistItems() {
    const rows = db.prepare('SELECT id_prod, qty FROM WISHLIST ORDER BY id_prod').all();
    if (rows.length === 0) {
        console.log('Wishlist is empty. Nothing to buy.');
        return;
    }

    for (const row of rows) {
        addToCart(row.id_prod, row.qty);
    }
    console.log(`Added ${rows.length} item(s) from wishlist to cart.`);
}

async function menuWishlist() {
    while (true) {
        viewWishlist(); // Show wishlist contents before each action
        const prompt = new Select({
            message: 'Wishlist Menu:',
            choices: ['Add to Wishlist', 'Remove from Wishlist', 'Buy items', 'Back']
        });

        const choice = await prompt.run();

        switch (choice) {
            case 'Add to Wishlist':
                listProducts();
                const productIdPrompt = new Input({ message: 'Enter product ID to add:' });
                const productIdRaw = await productIdPrompt.run();
                const productId = parseInt(productIdRaw, 10);

                const quantityPrompt = new Input({ message: 'Enter quantity:' });
                const quantityRaw = await quantityPrompt.run();
                const quantity = parseInt(quantityRaw, 10);

                try {
                    addToWishlist(productId, quantity);
                    console.log(`Added ${quantity} of product ${productId} to wishlist.`);
                } catch (error) {
                    console.log(`Error adding to wishlist: ${error.message}`);
                }
                break;

            case 'Remove from Wishlist':
                const removeIdPrompt = new Input({ message: 'Enter product ID to remove:' });
                const removeIdRaw = await removeIdPrompt.run();
                const removeId = parseInt(removeIdRaw, 10);

                try {
                    removeFromWishlist(removeId);
                    console.log(`Removed product ${removeId} from wishlist.`);
                } catch (error) {
                    console.log(`Error removing from wishlist: ${error.message}`);
                }
                break;

            case 'Buy items':
                try {
                    buyWishlistItems();
                } catch (error) {
                    console.log(`Error buying wishlist items: ${error.message}`);
                }
                break;

            case 'Back':
                console.clear();
                return;
        }
    }
}

export { menuWishlist };
