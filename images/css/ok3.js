$(document).ready(function() {
    $('.error-msg').hide();
	$('.loai-the').click(function(event) {
		var loaithe = $(this).attr('alt');
		$('input[name=loaithe]').val(loaithe);
		$('.loai-the').removeClass('active');
		$(this).addClass('active');
	});
	
	$('#garena-account').click(function(event) {
		//$('.cach-dang-nhap').hide();
		$('.taikhoan').removeClass('hide');
		$('input[name=account]').attr({placeholder: "Nháº­p ID tĂ i khoáº£n Garena"});
		return false;
	});
	
	$('#facebook-account').click(function(event) {
		//$('.cach-dang-nhap').hide();
		$('.taikhoan').removeClass('hide');
		$('input[name=account]').attr({placeholder: "Nháº­p Email hoáº·c SÄT Facebook"});
		return false;
	});
	
	
	$('#nap_rb').click(function(event) {
	$('#nap_rb').html('<i class="fa fa-spinner"></i> ÄANG Náº P THáºº');
	$('#nap_rb').prop('disabled',true);
	$('.error-msg').hide();
		$('.error-msg').addClass('hide');
		$('#result').html('');
		
		var taikhoan = $('input[name=account]').val();
		var loaithe = $('#loaithe').val();
		var seri = $('input[name=seri]').val();
		var mathe = $('input[name=mathe]').val();
		var menhgia = $('#menhgia :selected').val();
		var captcha = $('input[name=captcha]').val();
		
	
	
		if(menhgia == 0) {
		    $('.error-msg').show();
			$('.error-msg').removeClass('hide');
			$('.error-msg').html('<strong>Lá»—i:</strong> pháº£i chá»n má»‡nh giĂ¡ tháº»');
			$('#nap_rb').html('Náº¡p Tháº»');
	            $('#nap_rb').prop('disabled',false);
			return false;
		}
	
		if (loaithe == '') {
		    $('.error-msg').show();
			$('.error-msg').removeClass('hide');
			$('.error-msg').html('<strong>Lá»—i:</strong> báº¡n chÆ°a chá»n loáº¡i tháº»');
			$('#nap_rb').html('Náº¡p Tháº»');
	            $('#nap_rb').prop('disabled',false);
			return false;
		}
	
		if (seri.length < 9) {
		    $('.error-msg').show();
			$('.error-msg').removeClass('hide');
			$('.error-msg').html('<strong>Lá»—i:</strong> sá»‘ seri khĂ´ng há»£p lá»‡');
			$('#nap_rb').html('Náº¡p Tháº»');
	            $('#nap_rb').prop('disabled',false);
			return false;
		}
	
		if (mathe.length < 10) {
		    $('.error-msg').show();
			$('.error-msg').removeClass('hide');
			$('.error-msg').html('<strong>Lá»—i:</strong> mĂ£ tháº» khĂ´ng há»£p lá»‡');
			$('#nap_rb').html('Náº¡p Tháº»');
	            $('#nap_rb').prop('disabled',false);
			return false;
		}
	
		$.ajax({
			url: '/model/naptudong.php',
			type: 'POST',
			data: {tentk: taikhoan, loaithe: loaithe, menhgia: menhgia, serithe: seri, mathe: mathe, captcha: captcha},
			beforeSend: function () {
				$('#nap_rb').button('loading');
			},
			success: function(result) {
			    $('#nap_rb').html('Náº¡p Tháº»');
	            $('#nap_rb').prop('disabled',false);
	            $('.error-msg').hide();
	            $('.error-msg').html('');
				if(result) {
			        try {
			            respond = JSON.parse(result);
			            $('.error-msg').show();
			            if (respond.ketqua == false) {
			                
			               $('#result').html('<p class="alert alert-danger">'+respond.tinnhan+'</p>');
			              
			            } else {
			                
			            	$('#result').html('<p class="alert alert-success">'+respond.tinnhan+'</p>');
			            	
			            }
			        } catch(e) {
			            $('.error-msg').show();
			            $('#thongbaoloi').html('<p class="alert alert-danger tentk">Lá»—i: há»‡ thá»‘ng Ä‘ang báº£o trĂ¬ hoáº·c khĂ´ng hoáº¡t Ä‘á»™ng</p>');
			        }
			     }
				$('#nap_rb').button('reset');
			}
		})
		
	
	});
	
});