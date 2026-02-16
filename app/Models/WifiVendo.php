<?php

namespace App\Models;

use App\Concerns\LogsActivity;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WifiVendo extends Model
{
    /** @use HasFactory<\Database\Factories\WifiVendoFactory> */
    use HasFactory, LogsActivity;

    protected $fillable = [
        'name',
        'remarks',
        'monthly_collections',
    ];

    protected function casts(): array
    {
        return [
            'monthly_collections' => 'array',
        ];
    }
}
