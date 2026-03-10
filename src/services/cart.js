import pkg from 'enquirer';
const { Select, Input } = pkg;

async function menuCart() {
    while (true) {
        const prompt = new Select({
            message: 'Cart Menu:',
            choices: ['Add to Cart', 'Remove from Cart', 'View Cart', 'Back']
        });
        
        const choice = await prompt.run();
        
        switch (choice) {
            case 'Add to Cart':
                const productIdPrompt = new Input({ message: 'Enter product ID to add:' });
                const productId = await productIdPrompt.run();
                
                const quantityPrompt = new Input({ message: 'Enter quantity:' });
                const quantity = parseInt(await quantityPrompt.run());
                
                console.log(`Added ${quantity} of product ${productId} to cart (simulação)`);
                break;
                
            case 'Remove from Cart':
                const removeIdPrompt = new Input({ message: 'Enter product ID to remove:' });
                const removeId = await removeIdPrompt.run();
                
                console.log(`Removed product ${removeId} from cart (simulação)`);
                break;
                
            case 'View Cart':
                console.log("Viewing cart... (simulação - ainda não implementado)");
                break;
                
            case 'Back':
                console.clear();
                return;
        }
    }
}

export { menuCart };