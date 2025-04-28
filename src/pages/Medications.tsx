import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';

const mockMedications = [
  {
    id: '1',
    name: 'Paracetamol',
    code: 'N02BE01',
    form: 'Tableta'
  }
];

export default function Medications() {
  const [medications] = useState(mockMedications);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Medicamentos</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Medicamento
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forma</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {medications.map((medication) => (
              <tr key={medication.id}>
                <td className="px-6 py-4 whitespace-nowrap">{medication.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{medication.code}</td>
                <td className="px-6 py-4 whitespace-nowrap">{medication.form}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}