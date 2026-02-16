<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Note: No column changes needed. The monthly_collections JSON field 
     * already supports the new structure:
     * {
     *   "2026-02": {
     *     "amount": 5000,
     *     "remarks": "Collected by John",
     *     "confirmed_amount": 4950,
     *     "confirmed_by": 1,
     *     "confirmed_at": "2026-02-15 12:00:00",
     *     "discrepancy": 50
     *   }
     * }
     */
    public function up(): void
    {
        // No changes needed - JSON field is flexible
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No changes needed
    }
};
