import { crearProducto } from '@/actions/productos-actions'
import { obtenerProductos } from '@/actions/productos-actions'

export const dynamic = 'force-dynamic'

export default async function DiagnosticoPage() {
    const { productos } = await obtenerProductos({})

    return (
        <div className="p-10 space-y-8 bg-white min-h-screen text-black">
            <h1 className="text-2xl font-bold text-red-600">PANTALLA DE DIAGNÓSTICO</h1>

            <div className="border p-5 rounded bg-gray-100">
                <h2 className="font-bold mb-4">Prueba de Creación Directa</h2>
                {/* Formulario HTML nativo directo a la server action */}
                <form action={async (formData) => {
                    'use server'
                    await crearProducto(formData)
                }} className="space-y-4">
                    <div>
                        <label>Nombre:</label>
                        <input name="nombre" type="text" className="border p-1 w-full" defaultValue="Producto Test Diagnostico" />
                    </div>
                    <div>
                        <label>SKU:</label>
                        <input name="sku" type="text" className="border p-1 w-full" defaultValue={`TEST-${Math.floor(Math.random() * 1000)}`} />
                    </div>
                    <div>
                        <label>Precio:</label>
                        <input name="precio" type="number" className="border p-1 w-full" defaultValue="100" />
                    </div>
                    <div>
                        <label>Stock:</label>
                        <input name="stockActual" type="number" className="border p-1 w-full" defaultValue="10" />
                    </div>
                    <div>
                        <label>Stock Min:</label>
                        <input name="stockMinimo" type="number" className="border p-1 w-full" defaultValue="5" />
                    </div>
                    <button type="submit" className="bg-red-600 text-white p-2 rounded">INTENTAR CREAR</button>
                </form>
            </div>

            <div className="border p-5 rounded bg-gray-50">
                <h2 className="font-bold mb-4">Productos en Base de Datos ({productos?.length || 0})</h2>
                <pre className="text-xs bg-black text-green-400 p-4 rounded overflow-auto h-64">
                    {JSON.stringify(productos, null, 2)}
                </pre>
            </div>
        </div>
    )
}
