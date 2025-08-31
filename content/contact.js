$(function () {

   $('#contact-form').validator();

   $('#contact-form').on('submit', function (e) {
      e.preventDefault();
      $.ajax({
         type: 'POST',
         url: 'contact.php',
         data: $('#contact-form').serialize()
      }).done(function (data) {
         var messageAlert = 'alert-' + data.type;
         var messageText = data.message;

         var alertBox = '<div class="alert ' + messageAlert + ' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>' + messageText + '</div>';
         if (messageAlert && messageText) {
            $('#contact-form').find('.messages').html(alertBox);
            $('#contact-form')[0].reset();
            var elmnt = document.getElementById('contact-response');
            elmnt.scrollIntoView();
         }
      });
      return false;
   })
});