import pkg from 'enquirer';
const { Select } = pkg;
import { menuDatabase } from './services/product.js';
import { menuCart } from './services/cart.js';
import { menuWishlist } from './services/wishlist.js';

async function main() {
    console.clear();
    while (true) {
        const prompt = new Select({
            name: 'choice',
            message: 'Choose an option:',
            choices: [
                'Database (Manage Products)',
                'Cart (Manage Cart)',
                'Wishlist (Manage Wishlist)',
                'Exit'
            ]
        });
        
        const choice = await prompt.run();
        
        switch (choice) {
            case 'Database (Manage Products)':
                await menuDatabase();
                break;
            case 'Cart (Manage Cart)':
                await menuCart();
                break;
            case 'Wishlist (Manage Wishlist)':
                await menuWishlist();
                break;
            case 'Exit':
                console.log("Exiting...");
                process.exit(0);
        }
    }
}

main().catch(console.error);
