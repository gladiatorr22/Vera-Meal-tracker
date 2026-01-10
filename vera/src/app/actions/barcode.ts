"use server";

// ============================================================
// Open Food Facts API Integration
// ============================================================
// Free, open-source product database with nutritional info
// API Docs: https://world.openfoodfacts.org/data
// ============================================================

export interface ProductNutrition {
    barcode: string;
    name: string;
    brand?: string;
    imageUrl?: string;
    servingSize?: string;
    servingGrams?: number;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber: number;
    sugar?: number;
    sodium?: number;
    ingredients?: string;
    allergens?: string[];
    isSuccess: boolean;
}

interface OpenFoodFactsProduct {
    product_name?: string;
    brands?: string;
    image_url?: string;
    serving_size?: string;
    serving_quantity?: number;
    nutriments?: {
        "energy-kcal_100g"?: number;
        "proteins_100g"?: number;
        "carbohydrates_100g"?: number;
        "fat_100g"?: number;
        "fiber_100g"?: number;
        "sugars_100g"?: number;
        "sodium_100g"?: number;
    };
    ingredients_text?: string;
    allergens_tags?: string[];
}

/**
 * Fetch product info from Open Food Facts API
 */
export async function getProductByBarcode(barcode: string): Promise<ProductNutrition> {
    try {
        // Clean barcode (remove any spaces or dashes)
        const cleanBarcode = barcode.replace(/[\s-]/g, "");

        if (!cleanBarcode || cleanBarcode.length < 8) {
            return createErrorResult(barcode, "Invalid barcode format");
        }

        // Fetch from Open Food Facts API
        const response = await fetch(
            `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`,
            {
                headers: {
                    "User-Agent": "Vera Meal Tracker - https://github.com/vera-app",
                },
                next: { revalidate: 86400 }, // Cache for 24 hours
            }
        );

        if (!response.ok) {
            return createErrorResult(barcode, "Failed to fetch product data");
        }

        const data = await response.json();

        if (data.status !== 1 || !data.product) {
            return createErrorResult(barcode, "Product not found in database");
        }

        const product: OpenFoodFactsProduct = data.product;
        const nutriments = product.nutriments || {};

        // Extract per 100g values (standard)
        const calories = nutriments["energy-kcal_100g"] || 0;
        const protein = nutriments["proteins_100g"] || 0;
        const carbs = nutriments["carbohydrates_100g"] || 0;
        const fats = nutriments["fat_100g"] || 0;
        const fiber = nutriments["fiber_100g"] || 0;

        // Calculate per serving if available
        const servingGrams = product.serving_quantity || 100;
        const multiplier = servingGrams / 100;

        return {
            barcode: cleanBarcode,
            name: product.product_name || "Unknown Product",
            brand: product.brands,
            imageUrl: product.image_url,
            servingSize: product.serving_size,
            servingGrams,
            calories: Math.round(calories * multiplier),
            protein: Math.round(protein * multiplier),
            carbs: Math.round(carbs * multiplier),
            fats: Math.round(fats * multiplier),
            fiber: Math.round(fiber * multiplier),
            sugar: nutriments["sugars_100g"] ? Math.round(nutriments["sugars_100g"] * multiplier) : undefined,
            sodium: nutriments["sodium_100g"] ? Math.round(nutriments["sodium_100g"] * 1000 * multiplier) : undefined, // Convert to mg
            ingredients: product.ingredients_text,
            allergens: product.allergens_tags?.map((a) => a.replace("en:", "")),
            isSuccess: true,
        };
    } catch (error) {
        console.error("Barcode lookup error:", error);
        return createErrorResult(barcode, "Error fetching product data");
    }
}

function createErrorResult(barcode: string, message: string): ProductNutrition {
    console.log(`Barcode lookup failed for ${barcode}: ${message}`);
    return {
        barcode,
        name: message,
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        fiber: 0,
        isSuccess: false,
    };
}

/**
 * Search products by name (for manual lookup)
 */
export async function searchProducts(query: string, limit = 10): Promise<ProductNutrition[]> {
    try {
        const response = await fetch(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`,
            {
                headers: {
                    "User-Agent": "Vera Meal Tracker",
                },
            }
        );

        if (!response.ok) return [];

        const data = await response.json();
        const products: OpenFoodFactsProduct[] = data.products || [];

        return products.slice(0, limit).map((p) => {
            const nutriments = p.nutriments || {};
            const servingGrams = p.serving_quantity || 100;
            const multiplier = servingGrams / 100;

            return {
                barcode: "",
                name: p.product_name || "Unknown",
                brand: p.brands,
                imageUrl: p.image_url,
                servingSize: p.serving_size,
                servingGrams,
                calories: Math.round((nutriments["energy-kcal_100g"] || 0) * multiplier),
                protein: Math.round((nutriments["proteins_100g"] || 0) * multiplier),
                carbs: Math.round((nutriments["carbohydrates_100g"] || 0) * multiplier),
                fats: Math.round((nutriments["fat_100g"] || 0) * multiplier),
                fiber: Math.round((nutriments["fiber_100g"] || 0) * multiplier),
                isSuccess: true,
            };
        });
    } catch (error) {
        console.error("Product search error:", error);
        return [];
    }
}
