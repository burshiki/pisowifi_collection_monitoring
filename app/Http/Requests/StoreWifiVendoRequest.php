<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWifiVendoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:wifi_vendos,name'],
            'remarks' => ['nullable', 'string', 'max:500'],
            'monthly_collections' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A WiFi vendo with this name already exists. Please use a different name.',
        ];
    }
}
