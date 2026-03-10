import pkg from 'enquirer';
const { Select } = pkg;
import { menuDatabase } from './services/product.js';
import { menuCart } from './services/cart.js';

async function main() {
    console.clear();
    while (true) {
        const prompt = new Select({
            name: 'choice',
            message: 'Choose an option:',
            choices: [
                'Database (Manage Products)',
                'Cart (Manage Cart)',
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
            case 'Exit':
                console.log("Exiting...");
                process.exit(0);
        }
    }
}

main().catch(console.error);