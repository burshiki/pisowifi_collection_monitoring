<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WifiVendo>
 */
class WifiVendoFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $currentMonth = now()->format('Y-m');
        $lastMonth = now()->subMonth()->format('Y-m');
        
        // Randomly assign creation date - 30% new (this month), 70% old (1-6 months ago)
        $isNewVendo = fake()->boolean(30);
        $createdAt = $isNewVendo 
            ? now()->subDays(fake()->numberBetween(0, 14)) // New: created within last 15 days
            : now()->subMonths(fake()->numberBetween(1, 6))->subDays(fake()->numberBetween(0, 28)); // Old: 1-6 months ago
        
        // 70% chance of having current month collection
        $hasCurrentCollection = fake()->boolean(70);
        // 90% chance of having last month collection
        $hasLastCollection = fake()->boolean(90);
        
        $collections = [];
        
        if ($hasLastCollection) {
            $collections[$lastMonth] = [
                'amount' => fake()->numberBetween(500, 5000),
                'remarks' => fake()->optional()->sentence(),
            ];
        }
        
        if ($hasCurrentCollection) {
            $collections[$currentMonth] = [
                'amount' => fake()->numberBetween(500, 5000),
                'remarks' => fake()->optional()->sentence(),
            ];
        }
        
        static $counter = 901;
        
        return [
            'name' => 'VLAN' . $counter++,
            'remarks' => fake()->optional()->sentence(),
            'monthly_collections' => $collections,
            'created_at' => $createdAt,
            'updated_at' => $createdAt,
        ];
    }
}
