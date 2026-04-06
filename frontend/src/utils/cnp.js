export const validareCNP = (cnp) => {
    if (!/^\d{13}$/.test(cnp)) return false

      const s = parseInt(cnp[0])
        if (![1,2,3,4,5,6,7,8].includes(s)) return false

          const an = parseInt(cnp.substring(1, 3))
            const luna = parseInt(cnp.substring(3, 5))
              const zi = parseInt(cnp.substring(5, 7))
                const judet = parseInt(cnp.substring(7, 9))

                  // determinare secol
                    let anComplet
                      if ([1,2].includes(s)) anComplet = 1900 + an
                        else if ([3,4].includes(s)) anComplet = 1800 + an
                          else if ([5,6].includes(s)) anComplet = 2000 + an
                            else anComplet = 1900 + an // fallback pentru 7,8

                              // validare dată reală
                                const data = new Date(anComplet, luna - 1, zi)

                                  if (
                                      data.getFullYear() !== anComplet ||
                                          data.getMonth() !== luna - 1 ||
                                              data.getDate() !== zi
                                                ) return false

                                                  // validare județ (01–52)
                                                    if (judet < 1 || judet > 52) return false

                                                      // validare cifră de control
                                                        const control = [2,7,9,1,4,6,3,5,8,2,7,9]
                                                          let suma = 0

                                                            for (let i = 0; i < 12; i++) {
                                                                suma += parseInt(cnp[i]) * control[i]
                                                                  }

                                                                    const rest = suma % 11
                                                                      const cifra = rest === 10 ? 1 : rest

                                                                        return cifra === parseInt(cnp[12])
                                                                        }


                                                                        export const parseCNP = (cnp) => {
                                                                          if (!validareCNP(cnp)) return null

                                                                            const s = parseInt(cnp[0])
                                                                              const an = parseInt(cnp.substring(1, 3))
                                                                                const luna = cnp.substring(3, 5)
                                                                                  const zi = cnp.substring(5, 7)

                                                                                    let sex = ''
                                                                                      let anComplet

                                                                                        if ([1,3,5,7].includes(s)) sex = 'M'
                                                                                          else if ([2,4,6,8].includes(s)) sex = 'F'

                                                                                            if ([1,2].includes(s)) anComplet = 1900 + an
                                                                                              else if ([3,4].includes(s)) anComplet = 1800 + an
                                                                                                else if ([5,6].includes(s)) anComplet = 2000 + an
                                                                                                  else anComplet = 1900 + an

                                                                                                    return {
                                                                                                        sex,
                                                                                                            data_nastere: `${anComplet}-${luna}-${zi}`
                                                                                                              }
                                                                                                              }
}