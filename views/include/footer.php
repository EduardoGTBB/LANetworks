<!-- [ Footer ] start -->
        <footer class="footer">
            <p class="fs-11 text-muted fw-medium text-uppercase mb-0 copyright">
                <span>Copyright ©</span>
                <script>
                    document.write(new Date().getFullYear());
                </script>
            </p>
            <p><span>Desarrollado por: <a target="_blank" href="https://www.lupware.com" target="_blank">Lupware</a></span></p>
            <div class="d-flex align-items-center gap-4">
                <a href="javascript:void(0);" class="fs-11 fw-semibold text-uppercase">Ayuda</a>
                <!--<a href="javascript:void(0);" class="fs-11 fw-semibold text-uppercase">Terms</a>
                <a href="javascript:void(0);" class="fs-11 fw-semibold text-uppercase">Privacy</a>-->
            </div>
        </footer>
        <!-- [ Footer ] end -->
        <?php if($ver_whatsapp == 'Activado'): ?>
            <div id="back-top" >
                <a href="https://api.whatsapp.com/send?phone=525639705165&text=%C2%A1Hola!%20Quisiera%20información%20sobre%20LA%20Networks,%20busco%20una%20cotización." 
                    target="_blank">
                    <i class="fa-brands fa-whatsapp mx-1"></i>
                </a>
                <span class="whatsapp-tooltip">¡Hola! Necesito ayuda con el cotizador de LAN.</span>
            </div>
        <?php endif; ?>