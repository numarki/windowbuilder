/**
 *
 * &copy; Evgeniy Malyarov http://www.oknosoft.ru 2014-2016
 * @module main
 * Created 25.04.2016
 */


addEventListener("load", function() {
	setTimeout(hideURLbar, 0); }, false);

function hideURLbar(){ window.scrollTo(0,1); }

function a_click(elm) {

	function prepare_mail(text) {

		var div = document.querySelector("#wpcf7-f320-o1"),
			elm_name = $("[name='your-name']", div)[0];

		elm_name.scrollIntoView();
		setTimeout(elm_name.focus.bind(elm_name), 200);
		$("[name='your-message']", div)[0].value = "Подключение по тарифному плану '%1'".replace("%1", text);
	}

	function check_form() {

		var div = document.querySelector("#wpcf7-f320-o1"),
			form = $("form", div),
			name = $("[name='your-name']", div),
			email = $("[name='your-email']", div),
			message = $("[name='your-message']", div),
			error;

		if(!(/.+@.+\..+/i).test(email.val())){
			email.addClass("wpcf7-not-valid");
			email.on("change", clear_validation);
			email.on("keydown", clear_validation);
			error = true;
		}

		if(!name.val()){
			name.addClass("wpcf7-not-valid");
			name.on("change", clear_validation);
			name.on("keydown", clear_validation);
			error = true;
		}

		if(!message.val()){
			message.addClass("wpcf7-not-valid");
			message.on("change", clear_validation);
			message.on("keydown", clear_validation);
			error = true;
		}

		if(!error)
			return form;

	}

	function clear_validation() {
		$( this ).removeClass("wpcf7-not-valid");
		$( this ).off();
	}

	function send_mail(frm) {
		if(frm)
			$.ajax({
				type: frm.attr('method'),
				url: frm.attr('action'),
				data: frm.serialize()
			})
				.done(function(data) {
					console.log(data);
				})
				.fail(function(err) {
					console.log(err);
				});
				// .always(function() {
				// 	alert( "complete" );
				// });
	}

	switch(elm.name) {

		case 'beginer':
			prepare_mail("Начальный");
			break;

		case 'standart':
			prepare_mail("Стандарт");
			break;

		case 'premium':
			prepare_mail("Премиум");
			break;

		case 'mail':
			send_mail(check_form());
			break;
	}

	var e = window.event;
	e.preventDefault();
	e.cancelBubble = true;
	return false;
};


// script for menu
$( "span.menu" ).click(function() {
	$( ".top-menu" ).slideToggle( "slow", function() {
		// Animation complete.
	});
});


// FlexSlider
$(window).load(function(){

	$('.flexslider').flexslider({
		animation: "slide",
		start: function(slider){
			$('body').removeClass('loading');
		}
	});

});

$(document).ready(function($) {

	$(".scroll").click(function(event){
		event.preventDefault();
		$('html,body').animate({scrollTop:$(this.hash).offset().top},1200);
	});

	$(window).scroll(function() {
		var top = $(document).scrollTop();
		if (top < 80 && $(document).width() > 640){
			$("#site-navbar").css({"margin-top": "-6em"});
		}else{
			$("#site-navbar").css({"margin-top": "0px"});
		}
	});

	/*
	 var defaults = {
	 containerID: 'toTop', // fading element id
	 containerHoverID: 'toTopHover', // fading element hover id
	 scrollSpeed: 1200,
	 easingType: 'linear'
	 };
	 */

	$().UItoTop({ easingType: 'easeOutQuart' });

});

new WOW().init();