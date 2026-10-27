# Organizer Solution

Every rendered page source contains the decoy `HiM{d0_it_y0urs3lf}`. It is not the flag.

1. SQL injection lets you view all students with:

   ```text
   ' or 1=1 --
   ```

2. The search result reveals hidden record reference `0731`.
3. An IDOR lets you access that record at `http://localhost:3000/records/0731`.

The flag is:

```text
HiM{gr4d3s_4r3_n0t_pr1v4t3}
```