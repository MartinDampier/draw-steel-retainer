export function NumbersOnly(ev:KeyboardEvent) { 
    if(ev.code.contains('Key') || ev.code.contains('Enter') || ev.code.contains('Minus') ) 
    {
        ev.preventDefault(); 
    }
}